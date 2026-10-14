"use client"

import { useState, useTransition } from "react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useReactFlow, type Edge, type NodeChange, type EdgeChange } from "@xyflow/react"
import { Bot, LoaderCircle, Pencil, Send, Sparkles, Workflow } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { WorkflowGraph } from "@/lib/db/schema"
import { nodeRegistry, type StepNodeType } from "@/features/workflows/nodes/node-registry"

type ChatMessage = { role: "user" | "assistant"; content: string }

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "Tell me what you want to automate. I’ll draft the workflow for you to review.",
  },
]

const suggestions = [
  "Every day, find local places based on my favorite artists",
  "Open a website and extract the latest product price",
]

function toEditableWorkflow(graph: WorkflowGraph) {
  const orderedNodes = [...graph.nodes].sort((a, b) => a.position.x - b.position.x)
  const stepNumberByNodeId = new Map(orderedNodes.map((node, index) => [node.id, index + 1]))

  return {
    steps: orderedNodes.map((node) => ({
      type: node.data.type,
      title: node.data.title,
      values: Object.fromEntries(
        Object.entries(node.data.values).map(([key, value]) => [
          key,
          value.replace(/\{\{\s*([^\s.}]+)\.([^}]+?)\s*\}\}/g, (token, nodeId: string, path: string) => {
            const stepNumber = stepNumberByNodeId.get(nodeId)
            return stepNumber ? `{{ step_${stepNumber}.${path.trim()} }}` : token
          }),
        ])
      ),
    })),
  }
}

export function AiWorkflowBuilder() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [prompt, setPrompt] = useState("")
  const [draft, setDraft] = useState<WorkflowGraph | null>(null)
  const [isPending, startTransition] = useTransition()
  const { fitView } = useReactFlow<StepNodeType>()
  const { nodes, edges, onNodesChange, onEdgesChange } =
    useLiveblocksFlow<StepNodeType, Edge>({ suspense: true })

  const sendMessage = (message = prompt) => {
    const content = message.trim()
    if (!content || isPending) return

    const nextMessages = [...messages, { role: "user" as const, content }]
    setMessages(nextMessages)
    setPrompt("")

    startTransition(async () => {
      try {
        const response = await fetch("/api/workflows/ai-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.slice(-10),
            currentGraph: toEditableWorkflow(draft ?? { nodes, edges }),
          }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Could not generate a workflow.")

        if (result.graph) setDraft(result.graph as WorkflowGraph)
        setMessages((current) => [
          ...current,
          { role: "assistant", content: result.reply || "I’ve prepared a workflow draft." },
        ])
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          },
        ])
      }
    })
  }

  const applyDraft = () => {
    const hasCanvasWork = edges.length > 0 || nodes.some((node) => node.data.type !== "start")
    if (hasCanvasWork && !window.confirm("Replace the current canvas with this AI workflow draft?")) return

    const nodeChanges: NodeChange<StepNodeType>[] = [
      ...nodes.map((node) => ({ type: "remove" as const, id: node.id })),
      ...draft!.nodes.map((node, index) => ({ type: "add" as const, item: node, index })),
    ]
    const edgeChanges: EdgeChange<Edge>[] = [
      ...edges.map((edge) => ({ type: "remove" as const, id: edge.id })),
      ...draft!.edges.map((edge, index) => ({ type: "add" as const, item: edge, index })),
    ]

    onNodesChange(nodeChanges)
    onEdgesChange(edgeChanges)
    window.setTimeout(() => void fitView({ padding: 0.25, duration: 350 }), 120)
    setDraft(null)
    setMessages((current) => [
      ...current,
      { role: "assistant", content: "Added the workflow to your canvas. Review the node settings, then save or run it when you’re ready." },
    ])
  }

  const nodesToEdit = draft?.nodes ?? nodes.filter((node) => node.data.type !== "start")
  const requestNodeEdit = (node: StepNodeType) => {
    setPrompt(`Edit the “${node.data.title || nodeRegistry[node.data.type].label}” node: `)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        AI Workflow Builder
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <div className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">
          Describe the result you want. The AI will draft a workflow using the nodes available in this app.
          Ask for node setting changes here too; your canvas stays unchanged until you apply the draft. Don’t include passwords or other sensitive information.
        </div>

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === "user" ? "ml-5 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground" : "mr-2 flex gap-2 rounded-lg bg-muted px-3 py-2 text-xs"}
          >
            {message.role === "assistant" && <Bot className="mt-0.5 size-3.5 shrink-0 text-primary" />}
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        ))}

        {isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" /> Building your draft…
          </div>
        )}

        {draft && (
          <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Workflow className="size-3.5 text-primary" />
              Workflow draft · {draft.nodes.length} nodes
            </div>
            <p className="text-[11px] text-muted-foreground">You can keep refining node settings by chat before applying.</p>
            <div className="space-y-1">
              {nodesToEdit.map((node) => (
                <div key={node.id} className="flex items-center justify-between gap-1 text-xs">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {node.data.title || nodeRegistry[node.data.type].label}
                  </span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 shrink-0 px-1.5 text-[10px]" onClick={() => requestNodeEdit(node)}>
                    <Pencil /> Edit in chat
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" size="sm" className="w-full" onClick={applyDraft}>
              {edges.length || nodes.some((node) => node.data.type !== "start") ? "Replace canvas" : "Build on canvas"}
            </Button>
          </div>
        )}

        {!draft && nodesToEdit.length > 0 && (
          <div className="space-y-1 rounded-lg border p-3">
            <p className="mb-1 text-xs font-semibold">Edit the current workflow in chat</p>
            {nodesToEdit.map((node) => (
              <div key={node.id} className="flex items-center justify-between gap-1 text-xs">
                <span className="min-w-0 truncate text-muted-foreground">
                  {node.data.title || nodeRegistry[node.data.type].label}
                </span>
                <Button type="button" variant="ghost" size="sm" className="h-6 shrink-0 px-1.5 text-[10px]" onClick={() => requestNodeEdit(node)}>
                  <Pencil /> Edit in chat
                </Button>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">Changes will appear as a draft. Your canvas won’t change unless you apply it.</p>
          </div>
        )}

        {messages.length === 1 && !isPending && (
          <div className="space-y-1">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left text-[11px] text-muted-foreground"
                onClick={() => sendMessage(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>

      <form
        className="border-t border-border p-2"
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage()
        }}
      >
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Describe your workflow…"
          maxLength={2000}
          rows={3}
          disabled={isPending}
          className="resize-none text-xs"
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" size="sm" disabled={isPending || !prompt.trim()}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
            Build
          </Button>
        </div>
      </form>
    </div>
  )
}
