import { auth } from "@clerk/nextjs/server"

import { nodeRegistry } from "@/features/workflows/nodes/node-registry"
import { validateGraph } from "@/features/workflows/lib/validate-graph"
import type { NodeDefinition, NodeType, StepNodeType } from "@/features/workflows/nodes/node-registry"
import type { WorkflowGraph } from "@/lib/db/schema"

export const runtime = "nodejs"

const nodeTypes = Object.keys(nodeRegistry)
const responseSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    needsClarification: { type: "BOOLEAN" },
    followUpPrompts: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    steps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: nodeTypes },
          title: { type: "STRING" },
          values: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                key: { type: "STRING" },
                value: { type: "STRING" },
              },
              required: ["key", "value"],
            },
          },
        },
        required: ["type", "title", "values"],
      },
    },
  },
  required: ["reply", "needsClarification", "steps"],
}

type ChatMessage = { role: "user" | "assistant"; content: string }
type DraftStep = {
  type: string
  title: string
  values: { key: string; value: string }[]
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function getValueMap(step: DraftStep) {
  return Object.fromEntries(step.values.map(({ key, value }) => [key, value]))
}

function buildGraph(steps: DraftStep[]): { graph?: WorkflowGraph; error?: string } {
  if (steps.length < 2 || steps.length > 9) {
    return { error: "The workflow needs one trigger and between one and eight action steps." }
  }

  if (steps.some((step) => !Object.prototype.hasOwnProperty.call(nodeRegistry, step.type))) {
    return { error: "The AI returned an unsupported node type. Try describing the workflow more simply." }
  }
  const definitions = steps.map((step) => nodeRegistry[step.type as NodeType]) as NodeDefinition[]

  if (definitions[0].kind !== "trigger" || definitions.slice(1).some((definition) => definition.kind === "trigger")) {
    return { error: "A workflow must start with exactly one trigger. Please try again." }
  }

  const ids = steps.map(() => crypto.randomUUID())
  const nodes: StepNodeType[] = []

  for (const [index, step] of steps.entries()) {
    const definition = definitions[index]
    const proposedValues = getValueMap(step)
    const knownFields = new Set(definition.fields.map((field) => field.key))
    if (Object.keys(proposedValues).some((key) => !knownFields.has(key))) {
      return { error: `The AI gave an unknown setting for “${definition.label}”. Please try again.` }
    }

    const values = Object.fromEntries(
      definition.fields.flatMap((field) => {
        const value = proposedValues[field.key] ?? field.defaultValue
        return value === undefined || value === "" ? [] : [[field.key, value]]
      })
    ) as Record<string, string>

    for (const field of definition.fields) {
      if (field.showWhen && values[field.showWhen.field] !== field.showWhen.value) continue
      if (field.required && !values[field.key]?.trim()) {
        return {
          error: `I need the “${field.label}” for the ${definition.label} step. Reply with that detail and I’ll finish the workflow.`,
        }
      }
    }

    for (const value of Object.values(values)) {
      const references = [...value.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)]
      for (const [, reference] of references) {
        const match = reference.match(/^step_(\d+)\.([\w.[\]-]+)$/)
        const sourceIndex = match ? Number(match[1]) - 1 : -1
        const output = match?.[2]
        if (
          sourceIndex < 0 ||
          sourceIndex >= index ||
          !output ||
          !definitions[sourceIndex].outputs.some((candidate) => candidate.path === output)
        ) {
          return { error: "One of the generated connections is invalid. Please ask me to build it again." }
        }
      }
    }

    const resolvedValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value.replace(/\{\{\s*step_(\d+)\.([\w.[\]-]+)\s*\}\}/g, (_token, stepNumber: string, path: string) =>
          `{{ ${ids[Number(stepNumber) - 1]}.${path} }}`
        ),
      ])
    )

    nodes.push({
      id: ids[index],
      type: "step",
      position: { x: index * 280, y: 80 },
      data: {
        type: step.type as StepNodeType["data"]["type"],
        kind: definition.kind,
        title: step.title.trim().slice(0, 80) || definition.label,
        values: resolvedValues,
      },
    })
  }

  const graph: WorkflowGraph = {
    nodes,
    edges: nodes.slice(1).map((node, index) => ({
      id: crypto.randomUUID(),
      source: nodes[index].id,
      target: node.id,
      type: "smoothstep",
    })),
  }
  const problems = validateGraph(graph)
  if (problems.length) return { error: problems[0] }
  return { graph }
}

export async function POST(request: Request) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) return jsonError("Sign in to use the AI workflow builder.", 401)

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) return jsonError("Add GEMINI_API_KEY to your server environment to use the AI builder.", 503)

  let body: { messages?: unknown; currentGraph?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonError("The request body must be valid JSON.", 400)
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 10) {
    return jsonError("Send between one and ten chat messages.", 400)
  }
  const messages = body.messages as ChatMessage[]
  if (messages.some((message) =>
    !message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string" || message.content.length > 2000
  )) {
    return jsonError("Each message must have a role and text under 2,000 characters.", 400)
  }

  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")
  if (!lastUserMessage?.content.trim()) return jsonError("Describe what you want the workflow to do.", 400)

  const catalog = (Object.values(nodeRegistry) as NodeDefinition[]).map((node) => ({
    type: node.type,
    name: node.label,
    kind: node.kind,
    fields: node.fields.map(({ key, label, required, defaultValue, options, showWhen }) => ({
      key, label, required: Boolean(required), defaultValue,
      options: options?.map(({ label: optionLabel, value }) => ({ label: optionLabel, value })),
      showWhen,
    })),
    outputs: node.outputs.map(({ path, label }) => ({ path, label })),
  }))

  const currentGraph = body.currentGraph && typeof body.currentGraph === "object"
    ? JSON.stringify(body.currentGraph).slice(0, 16000)
    : "No current workflow draft."
  const transcript = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n")
  const systemInstruction = `You help users create, edit, explain, and optimize workflows in a visual browser automation app. Return a concise helpful reply, 2-3 short actionable followUpPrompts (under 60 chars each) that suggest useful next refinements, and a complete linear workflow as structured output. Only use the provided node catalog. A workflow must contain exactly one trigger as its first step, then action steps. Use the start trigger for manual runs and schedule for timed runs. Never claim an unsupported capability. If the user only asks to explain or audit the workflow without changing it, or if required details are missing, set needsClarification=true, answer or ask one concise question in reply, and return steps=[]. Do not guess URLs, recipients, credentials, or personal data. For settings that use data from earlier nodes, write references exactly as {{ step_1.outputPath }} using a 1-based step number and an output path listed in the catalog. Keep at most eight action steps. The existing workflow is provided as ordered steps; when the user asks to edit, add, or remove a node, preserve the other existing steps and every setting they did not ask to change. Only replace the entire workflow when the user asks for a new or different workflow. Node IDs and positions are hidden from you; use step_N references for outputs. Existing workflow draft: ${currentGraph}\nNode catalog: ${JSON.stringify(catalog)}`

  let geminiResponse: Response
  try {
    geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: transcript }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 5000,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      }
    )
  } catch {
    return jsonError("Could not reach Gemini. Check your network connection and try again.", 502)
  }

  const result = await geminiResponse.json().catch(() => null)
  if (!geminiResponse.ok) {
    console.error("Gemini workflow builder request failed:", result?.error?.message ?? geminiResponse.status)
    return jsonError("Gemini could not create a draft right now. Please try again.", 502)
  }

  const text = result?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => part.text)?.text
  if (typeof text !== "string") return jsonError("Gemini returned an empty response. Please try again.", 502)

  let generated: {
    reply: string
    needsClarification: boolean
    followUpPrompts?: string[]
    steps: DraftStep[]
  }
  try {
    generated = JSON.parse(text)
  } catch {
    return jsonError("Gemini returned a response I could not read. Please try again.", 502)
  }

  if (typeof generated.reply !== "string" || typeof generated.needsClarification !== "boolean" || !Array.isArray(generated.steps)) {
    return jsonError("Gemini returned an invalid workflow draft. Please try again.", 502)
  }
  const followUpPrompts = Array.isArray(generated.followUpPrompts)
    ? generated.followUpPrompts.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 3)
    : []

  if (generated.needsClarification) {
    return Response.json({ reply: generated.reply, followUpPrompts })
  }

  const built = buildGraph(generated.steps)
  if (!built.graph) {
    return Response.json({ reply: built.error, needsClarification: true, followUpPrompts })
  }

  return Response.json({ reply: generated.reply, graph: built.graph, followUpPrompts })
}
