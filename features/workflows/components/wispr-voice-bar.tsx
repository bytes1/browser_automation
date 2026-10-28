"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import {
  useReactFlow,
  useStore,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react"
import { useWorkflowFlow } from "@/features/workflows/components/workflow-flow-provider"
import {
  AudioLines,
  CheckCircle2,
  Crosshair,
  LoaderCircle,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WorkflowGraph } from "@/lib/db/schema"
import {
  nodeRegistry,
  type NodeField,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

type VoiceLogItem = {
  id: string
  spoken: string
  actionSummary: string
  mode: "step" | "ai"
}

function toEditableWorkflow(graph: WorkflowGraph) {
  const orderedNodes = [...graph.nodes].sort(
    (a, b) => a.position.x - b.position.x
  )
  const stepNumberByNodeId = new Map(
    orderedNodes.map((node, index) => [node.id, index + 1])
  )

  return {
    steps: orderedNodes.map((node) => ({
      type: node.data.type,
      title: node.data.title,
      values: Object.fromEntries(
        Object.entries(node.data.values).map(([key, value]) => [
          key,
          value.replace(
            /\{\{\s*([^\s.}]+)\.([^}]+?)\s*\}\}/g,
            (token, nodeId: string, path: string) => {
              const stepNumber = stepNumberByNodeId.get(nodeId)
              return stepNumber ? `{{ step_${stepNumber}.${path.trim()} }}` : token
            }
          ),
        ])
      ),
    })),
  }
}

function normalizeSpokenUrl(raw: string): string {
  let cleaned = raw
    .trim()
    .replace(/[.,;!?]+$/, "")
    .replace(/\s+dot\s+/gi, ".")
    .replace(/\s+slash\s+/gi, "/")
    .replace(/\s+/g, "")
  if (!cleaned) return "https://google.com"
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`
  }
  return cleaned
}

function detectNodeTypeFromPhrase(phrase: string): NodeType | null {
  const lower = phrase.toLowerCase()
  if (/\b(schedule|cron|timer|every\s+day|daily\s+trigger)\b/.test(lower)) {
    return "schedule"
  }
  if (/\b(start\s+node|start\s+trigger|trigger\s+node|^add\s+start$|^create\s+start$)\b/.test(lower)) {
    return "start"
  }
  if (
    /\b(open\s*url|open\s*link|open\s*page|visit\s*url|navigate\s*to|browser\s*open|go\s*to\s*url)\b/.test(
      lower
    )
  ) {
    return "open-url"
  }
  if (/\b(extract\s+node|extract\s+step|stagehand\s+extract|scrape\s+node|^add\s+extract)\b/.test(lower)) {
    return "extract"
  }
  if (/\b(act\s+node|action\s+node|click\s+node|browser\s+act|^add\s+act)\b/.test(lower)) {
    return "act"
  }
  if (/\b(observe\s+node|observe\s+step|^add\s+observe)\b/.test(lower)) {
    return "observe"
  }
  if (
    /\b(qloo\s+compare|taste\s+overlap|overlap\s+node|compare\s+taste|compare\s+node)\b/.test(
      lower
    )
  ) {
    return "qloo-compare"
  }
  if (
    /\b(qloo\s+demographics|audience\s+persona|demographics\s+node|persona\s+node)\b/.test(
      lower
    )
  ) {
    return "qloo-demographics"
  }
  if (
    /\b(qloo\s+local|local\s+discovery|local\s+places|local\s+venues|local\s+node)\b/.test(
      lower
    )
  ) {
    return "qloo-local"
  }
  if (
    /\b(qloo\s+recommend|qloo\s+recommendations|recommendations?\s+node|brand\s+match\s+node)\b/.test(
      lower
    )
  ) {
    return "qloo-recommend"
  }
  if (
    /\b(qloo\s+search|qloo\s+seeds?|taste\s+seeds?|seed\s+node|qloo\s+node)\b/.test(
      lower
    )
  ) {
    return "qloo-search"
  }
  if (
    /\b(ai\s+synthesize|synthesizer\s+node|cultural\s+synthesizer|synthesize\s+node|brief\s+node)\b/.test(
      lower
    )
  ) {
    return "ai-synthesize"
  }
  if (/\b(send\s+email|email\s+node|email\s+step|mail\s+node)\b/.test(lower)) {
    return "send-email"
  }
  return null
}

function findNodeBySpokenRef(
  refText: string,
  nodes: StepNodeType[]
): StepNodeType | undefined {
  const clean = refText.trim().toLowerCase()
  if (!clean) return undefined

  const ordered = [...nodes].sort((a, b) => a.position.x - b.position.x)

  // 1. "step 1", "node 2", "first node", "last node"
  const stepMatch = clean.match(/\b(?:step|node)\s*(\d+)\b/)
  if (stepMatch) {
    const idx = Number.parseInt(stepMatch[1], 10) - 1
    if (ordered[idx]) return ordered[idx]
  }
  if (/\b(last\s+node|previous\s+node|latest\s+node)\b/.test(clean)) {
    return ordered[ordered.length - 1]
  }
  if (/\b(first\s+node|start\s+node|start\s+trigger|^start$)\b/.test(clean)) {
    return (
      ordered.find((n) => n.data.kind === "trigger" || n.data.type === "start") ??
      ordered[0]
    )
  }

  // 2. Exact or partial title match
  const byTitle = ordered.find(
    (n) =>
      n.data.title.toLowerCase() === clean ||
      clean.includes(n.data.title.toLowerCase()) ||
      n.data.title.toLowerCase().includes(clean.replace(/\s+node$/, ""))
  )
  if (byTitle) return byTitle

  // 3. Node type match
  const detectedType = detectNodeTypeFromPhrase(clean)
  if (detectedType) {
    const matching = ordered.filter((n) => n.data.type === detectedType)
    return matching[matching.length - 1]
  }

  return undefined
}

function extractInitialValuesFromSpeech(
  type: NodeType,
  text: string,
  upstreamNode?: StepNodeType
): Record<string, string> {
  const def = nodeRegistry[type]
  const defaults = Object.fromEntries(
    (def.fields as NodeField[])
      .filter((f) => f.defaultValue !== undefined)
      .map((f) => [f.key, f.defaultValue!])
  )

  const clean = text.trim()
  const lower = clean.toLowerCase()

  if (type === "open-url") {
    // Look for a domain or URL after "open", "to", "url", "link", "visit"
    const urlMatch =
      clean.match(
        /\b(?:https?:\/\/[^\s,]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|ai|dev|co|edu|gov)(?:\/[^\s,]*)?)\b/i
      ) ??
      clean.match(
        /\b(?:and\s+open|to\s+open|open|visit|url|website)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s,]*)/i
      )
    if (urlMatch) {
      defaults.url = normalizeSpokenUrl(urlMatch[1] ?? urlMatch[0])
    } else if (
      upstreamNode &&
      (upstreamNode.data.type === "qloo-local" ||
        upstreamNode.data.type === "qloo-recommend")
    ) {
      defaults.url = `https://www.google.com/search?q={{ ${upstreamNode.id}.searchQuery }}`
    }
  } else if (type === "act" || type === "extract" || type === "observe") {
    const instrMatch = clean.match(
      /\b(?:and|to|with\s+instruction|instruction|that)\s+(.+)$/i
    )
    if (instrMatch?.[1]) {
      defaults.instruction = instrMatch[1].trim().replace(/[.]+$/, "")
    }
  } else if (type === "qloo-search") {
    if (upstreamNode?.data.type === "extract") {
      defaults.query = `{{ ${upstreamNode.id}.data }}`
    }
    const seedMatch = clean.match(
      /\b(?:for|with\s+query|query|seeds?|like)\s+(.+)$/i
    )
    if (seedMatch?.[1]) {
      defaults.query = seedMatch[1].trim().replace(/[.]+$/, "")
    }
  } else if (type === "qloo-recommend" || type === "qloo-local") {
    if (upstreamNode?.data.type === "qloo-search") {
      defaults.entityIds = `{{ ${upstreamNode.id}.entityIds }}`
    }
    const cityMatch = clean.match(
      /\b(?:in|for\s+city|city)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/
    )
    if (cityMatch?.[1]) {
      defaults.city = cityMatch[1].trim()
    }
    if (type === "qloo-recommend") {
      if (/\bbrand|brands|fashion\b/.test(lower))
        defaults.targetType = "urn:entity:brand"
      else if (/\bmovie|movies|film\b/.test(lower))
        defaults.targetType = "urn:entity:movie"
      else if (/\bbook|books\b/.test(lower))
        defaults.targetType = "urn:entity:book"
      else if (/\bpodcast|podcasts\b/.test(lower))
        defaults.targetType = "urn:entity:podcast"
      else if (/\bartist|music\b/.test(lower))
        defaults.targetType = "urn:entity:artist"
      else if (/\bplace|places|venue|bar|restaurant\b/.test(lower))
        defaults.targetType = "urn:entity:place"
    }
  } else if (type === "qloo-compare") {
    const betweenMatch = clean.match(
      /\b(?:between|compare)\s+(.+?)\s+(?:and|vs\.?|versus)\s+(.+)$/i
    )
    if (betweenMatch) {
      defaults.firstSeeds = betweenMatch[1].trim()
      defaults.secondSeeds = betweenMatch[2].trim().replace(/[.]+$/, "")
    }
  } else if (type === "qloo-demographics") {
    if (upstreamNode?.data.type === "qloo-search") {
      defaults.entityIds = `{{ ${upstreamNode.id}.entityIds }}`
    }
    const forMatch = clean.match(/\b(?:for|of)\s+(.+)$/i)
    if (forMatch?.[1]) {
      defaults.entityIds = forMatch[1].trim().replace(/[.]+$/, "")
    }
  } else if (type === "ai-synthesize") {
    if (/\bpitch\b/.test(lower)) defaults.format = "pitch"
    else if (/\bitinerary\b/.test(lower)) defaults.format = "itinerary"
    else if (/\boutreach|email\b/.test(lower)) defaults.format = "outreach"
    else defaults.format = "brief"

    defaults.instruction =
      "Combine the upstream cultural taste insights and extracted web details into a polished deliverable."
    if (upstreamNode) {
      const outPath =
        upstreamNode.data.type === "extract" ? "data" : "summary"
      defaults.contextData = `{{ ${upstreamNode.id}.${outPath} }}`
    }
  } else if (type === "send-email") {
    const emailMatch = clean.match(
      /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/
    )
    if (emailMatch?.[1]) {
      defaults.to = emailMatch[1]
    }
    const subjectMatch = clean.match(/\bsubject\s+([^,.;]+)/i)
    if (subjectMatch?.[1]) {
      defaults.subject = subjectMatch[1].trim()
    } else {
      defaults.subject = "Automated Workflow Report"
    }
    if (upstreamNode) {
      const outPath =
        upstreamNode.data.type === "extract" ? "data" : "summary"
      defaults.body = `Here is your workflow report:\n\n{{ ${upstreamNode.id}.${outPath} }}`
    }
  }

  return defaults
}

const STEP_VOICE_EXAMPLES = [
  "Add start node",
  "Connect start node with open link node and open google.com",
  "Add extract node to extract the top 3 results",
  "Change URL to wikipedia.org",
  "Connect extract node with Qloo taste seeds",
]

export function WisprVoiceBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [autoExecuteOnDictation, setAutoExecuteOnDictation] = useState(true)
  const [dictationCaptured, setDictationCaptured] = useState(false)
  const [logs, setLogs] = useState<VoiceLogItem[]>([])
  const [previousGraph, setPreviousGraph] = useState<WorkflowGraph | null>(null)
  const [isPending, startTransition] = useTransition()

  const inputRef = useRef<HTMLInputElement | null>(null)
  const autoSubmitTimerRef = useRef<number | null>(null)
  const lastLengthRef = useRef(0)

  const { fitView, updateNodeData } = useReactFlow<StepNodeType>()
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useWorkflowFlow()

  const selectedNode = useStore((s) =>
    s.nodes.find((n) => n.selected)
  ) as StepNodeType | undefined

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setIsOpen((prev) => {
          const next = !prev
          if (next) {
            window.setTimeout(() => inputRef.current?.focus(), 40)
          }
          return next
        })
      } else if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (autoSubmitTimerRef.current) {
        window.clearTimeout(autoSubmitTimerRef.current)
      }
    }
  }, [])

  const saveSnapshot = () => {
    setPreviousGraph({
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    })
  }

  const pushLog = (spoken: string, actionSummary: string, mode: "step" | "ai") => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), spoken, actionSummary, mode },
      ...prev.slice(0, 3),
    ])
  }

  const applyFullGraphToCanvas = (targetGraph: WorkflowGraph) => {
    saveSnapshot()

    const orderedExistingNodes = [...nodes].sort(
      (a, b) => a.position.x - b.position.x
    )
    const idMap = new Map<string, string>()

    targetGraph.nodes.forEach((draftNode, index) => {
      const existingNode = orderedExistingNodes[index]
      if (existingNode && existingNode.data.type === draftNode.data.type) {
        idMap.set(draftNode.id, existingNode.id)
      } else {
        idMap.set(draftNode.id, draftNode.id)
      }
    })

    const nextNodes: StepNodeType[] = targetGraph.nodes.map(
      (draftNode, index) => {
        const resolvedId = idMap.get(draftNode.id) ?? draftNode.id
        const existingNode = orderedExistingNodes[index]
        const preservePosition =
          existingNode && existingNode.id === resolvedId
            ? existingNode.position
            : draftNode.position

        const resolvedValues = Object.fromEntries(
          Object.entries(draftNode.data.values).map(([key, value]) => [
            key,
            value.replace(
              /\{\{\s*([^\s.}]+)\.([^}]+?)\s*\}\}/g,
              (token, refId: string, path: string) => {
                const mappedId = idMap.get(refId)
                return mappedId ? `{{ ${mappedId}.${path.trim()} }}` : token
              }
            ),
          ])
        )

        return {
          ...draftNode,
          id: resolvedId,
          position: preservePosition,
          data: {
            ...draftNode.data,
            values: resolvedValues,
          },
        }
      }
    )

    const nextEdges: Edge[] = targetGraph.edges.map((edge) => ({
      ...edge,
      source: idMap.get(edge.source) ?? edge.source,
      target: idMap.get(edge.target) ?? edge.target,
    }))

    onDelete({ nodes, edges })

    const nodeChanges: NodeChange<StepNodeType>[] = nextNodes.map(
      (node, index) => ({
        type: "add" as const,
        item: node,
        index,
      })
    )
    const edgeChanges: EdgeChange<Edge>[] = nextEdges.map((edge, index) => ({
      type: "add" as const,
      item: edge,
      index,
    }))

    onNodesChange(nodeChanges)
    onEdgesChange(edgeChanges)
    window.setTimeout(() => void fitView({ padding: 0.25, duration: 350 }), 120)
  }

  /**
   * Attempts to execute incremental step-by-step voice commands locally & instantly:
   *  - "add start node"
   *  - "connect start node with open link node and open google.com"
   *  - "add extract node to extract top 3 results"
   *  - "connect step 1 to step 2"
   *  - "change url to https://news.ycombinator.com" / "edit open url to open wikipedia.org"
   *  - "set instruction to click sign in" / "change city to Tokyo"
   *  - "delete this node" / "remove step 3"
   * Returns a human-readable summary if handled locally, or null if it should fall back to AI.
   */
  const tryExecuteIncrementalCommand = (rawCommand: string): string | null => {
    const clean = rawCommand.trim()
    const lower = clean.toLowerCase()
    const orderedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x)

    // -------------------------------------------------------------------------
    // 1. DELETE / REMOVE / CLEAR COMMANDS
    // -------------------------------------------------------------------------
    if (/^(?:clear\s+canvas|reset\s+canvas|delete\s+all\s+nodes)/i.test(clean)) {
      saveSnapshot()
      const startNode: StepNodeType = {
        id: "start",
        type: "step",
        position: { x: 0, y: 0 },
        data: { type: "start", kind: "trigger", title: "Start", values: {} },
      }
      onDelete({ nodes, edges })
      onNodesChange([{ type: "add", item: startNode, index: 0 }])
      return "Cleared canvas back to Start node"
    }

    const deleteMatch = clean.match(
      /^(?:delete|remove)\s+(?:the\s+)?(.+?)(?:\s+node|\s+step)?$/i
    )
    if (deleteMatch) {
      const targetPhrase = deleteMatch[1].trim()
      const targetNode =
        /^(?:this|selected|current)$/i.test(targetPhrase)
          ? selectedNode
          : findNodeBySpokenRef(targetPhrase, nodes)

      if (targetNode) {
        if (targetNode.data.kind === "trigger") {
          toast.error("Cannot delete the trigger node.")
          return "Trigger node kept on canvas"
        }
        saveSnapshot()
        const connectedEdges = edges.filter(
          (e) => e.source === targetNode.id || e.target === targetNode.id
        )
        onDelete({ nodes: [targetNode], edges: connectedEdges })
        return `Deleted "${targetNode.data.title}"`
      }
    }

    // -------------------------------------------------------------------------
    // 2. EDIT / UPDATE / CHANGE / SET NODE PROPERTIES BY VOICE
    //    e.g., "change url to wikipedia.org",
    //    "edit open link node to open github.com",
    //    "set instruction to extract all titles",
    //    "change city to Kyoto", "rename step 2 to Scrape Products"
    // -------------------------------------------------------------------------
    const renameMatch = clean.match(
      /^rename\s+(?:this\s+node|selected\s+node|.+?)\s+to\s+(.+)$/i
    )
    if (renameMatch) {
      const newTitle = renameMatch[1].trim().replace(/[.]+$/, "")
      const target = selectedNode ?? orderedNodes[orderedNodes.length - 1]
      if (target && newTitle) {
        saveSnapshot()
        updateNodeData(target.id, { title: newTitle })
        return `Renamed "${target.data.title}" → "${newTitle}"`
      }
    }

    const editFieldMatch = clean.match(
      /^(?:edit|update|change|set)\s+(?:the\s+)?(.+?)\s+(?:to|as|with)\s+(.+)$/i
    )
    if (editFieldMatch) {
      const leftSide = editFieldMatch[1].trim().toLowerCase()
      const newValueRaw = editFieldMatch[2].trim().replace(/[.]+$/, "")

      // Find which node the user is editing (explicitly named, or selectedNode, or last matching node)
      const explicitNode = findNodeBySpokenRef(leftSide, nodes)
      let targetNode = explicitNode ?? selectedNode

      // Determine which field key is being modified
      let fieldKey: string | null = null
      if (/\b(url|link|website|page|address)\b/.test(leftSide)) {
        fieldKey = "url"
        if (!targetNode) {
          targetNode = [...orderedNodes]
            .reverse()
            .find((n) => n.data.type === "open-url")
        }
      } else if (/\b(instruction|prompt|action)\b/.test(leftSide)) {
        fieldKey = "instruction"
        if (!targetNode) {
          targetNode = [...orderedNodes]
            .reverse()
            .find((n) =>
              ["act", "extract", "observe", "ai-synthesize"].includes(
                n.data.type
              )
            )
        }
      } else if (/\b(query|seeds?|favorites?)\b/.test(leftSide)) {
        fieldKey = "query"
        if (!targetNode) {
          targetNode = [...orderedNodes]
            .reverse()
            .find((n) => n.data.type === "qloo-search")
        }
      } else if (/\b(city|location)\b/.test(leftSide)) {
        fieldKey = "city"
        if (!targetNode) {
          targetNode = [...orderedNodes]
            .reverse()
            .find((n) =>
              ["qloo-local", "qloo-recommend", "qloo-compare"].includes(
                n.data.type
              )
            )
        }
      } else if (/\b(vibe|vibes|vibe\s+tags|mood)\b/.test(leftSide)) {
        fieldKey = "vibeTags"
        if (!targetNode) {
          targetNode = [...orderedNodes]
            .reverse()
            .find((n) =>
              ["qloo-local", "qloo-recommend"].includes(n.data.type)
            )
        }
      } else if (/\b(recipient|email\s+address|to)\b/.test(leftSide)) {
        fieldKey = "to"
        if (!targetNode) {
          targetNode = [...orderedNodes]
            .reverse()
            .find((n) => n.data.type === "send-email")
        }
      } else if (/\b(subject)\b/.test(leftSide)) {
        fieldKey = "subject"
        if (!targetNode) {
          targetNode = [...orderedNodes]
            .reverse()
            .find((n) => n.data.type === "send-email")
        }
      } else if (/\b(limit|count)\b/.test(leftSide)) {
        fieldKey = "limit"
      }

      // If the user said "edit open link node to open google.com"
      if (!fieldKey && targetNode) {
        if (targetNode.data.type === "open-url") fieldKey = "url"
        else if (
          ["act", "extract", "observe", "ai-synthesize"].includes(
            targetNode.data.type
          )
        )
          fieldKey = "instruction"
        else if (targetNode.data.type === "qloo-search") fieldKey = "query"
        else if (targetNode.data.type === "qloo-local") fieldKey = "city"
      }

      if (targetNode && fieldKey) {
        saveSnapshot()
        const finalValue =
          fieldKey === "url"
            ? normalizeSpokenUrl(newValueRaw.replace(/^open\s+/i, ""))
            : newValueRaw
        updateNodeData(targetNode.id, {
          values: {
            ...targetNode.data.values,
            [fieldKey]: finalValue,
          },
        })
        return `Updated "${targetNode.data.title}" (${fieldKey} → ${finalValue})`
      }
    }

    // -------------------------------------------------------------------------
    // 3. CONNECT TWO EXISTING NODES OR "CONNECT <SOURCE> WITH <NEW NODE>"
    //    e.g., "connect start node with openlink node and open google.com"
    //    or "connect step 1 to step 2"
    // -------------------------------------------------------------------------
    const connectMatch = clean.match(
      /^connect\s+(.+?)\s+(?:with|to|and)\s+(.+)$/i
    )
    if (connectMatch) {
      const sourcePhrase = connectMatch[1].trim()
      const targetRest = connectMatch[2].trim()

      const sourceNode =
        findNodeBySpokenRef(sourcePhrase, nodes) ??
        selectedNode ??
        orderedNodes[orderedNodes.length - 1]

      if (sourceNode) {
        // Check if target already exists on the canvas AND user isn't asking to configure a new node
        const existingTarget = findNodeBySpokenRef(targetRest, nodes)
        const targetNewType = detectNodeTypeFromPhrase(targetRest)
        const hasExtraConfig = /\b(?:and\s+open|to\s+open|to\s+extract|for\s+|in\s+[A-Z]|https?:\/\/|\.[a-z]{2,})\b/i.test(
          targetRest
        )

        if (
          existingTarget &&
          existingTarget.id !== sourceNode.id &&
          !hasExtraConfig
        ) {
          const alreadyConnected = edges.some(
            (e) =>
              e.source === sourceNode.id && e.target === existingTarget.id
          )
          if (!alreadyConnected) {
            saveSnapshot()
            const newEdge: Edge = {
              id: crypto.randomUUID(),
              source: sourceNode.id,
              target: existingTarget.id,
              type: "smoothstep",
            }
            onEdgesChange([{ type: "add", item: newEdge }])

            // Auto-wire common upstream tokens when connecting
            if (
              sourceNode.data.type === "extract" &&
              existingTarget.data.type === "qloo-search" &&
              !existingTarget.data.values.query
            ) {
              updateNodeData(existingTarget.id, {
                values: {
                  ...existingTarget.data.values,
                  query: `{{ ${sourceNode.id}.data }}`,
                },
              })
            } else if (
              sourceNode.data.type === "qloo-search" &&
              (existingTarget.data.type === "qloo-recommend" ||
                existingTarget.data.type === "qloo-local") &&
              !existingTarget.data.values.entityIds
            ) {
              updateNodeData(existingTarget.id, {
                values: {
                  ...existingTarget.data.values,
                  entityIds: `{{ ${sourceNode.id}.entityIds }}`,
                },
              })
            }
            return `Connected "${sourceNode.data.title}" → "${existingTarget.data.title}"`
          }
          return `"${sourceNode.data.title}" is already connected to "${existingTarget.data.title}"`
        }

        // Otherwise, create the new target node, configure it from speech, and connect from sourceNode!
        const inferredType: NodeType | null =
          targetNewType ??
          (/\b(?:open|google\.|wikipedia\.|\.com|\.org|\.io)\b/i.test(
            targetRest
          )
            ? "open-url"
            : /\bextract\b/i.test(targetRest)
              ? "extract"
              : /\bclick|type|scroll\b/i.test(targetRest)
                ? "act"
                : null)

        if (inferredType && inferredType !== "start" && inferredType !== "schedule") {
          saveSnapshot()
          const def = nodeRegistry[inferredType]
          const sameTypeCount = nodes.filter(
            (n) => n.data.type === inferredType
          ).length
          const title =
            sameTypeCount === 0
              ? def.label
              : `${def.label} ${sameTypeCount + 1}`
          const newId = crypto.randomUUID()
          const newValues = extractInitialValuesFromSpeech(
            inferredType,
            targetRest,
            sourceNode
          )

          const newNode: StepNodeType = {
            id: newId,
            type: "step",
            position: {
              x: sourceNode.position.x + 280,
              y: sourceNode.position.y,
            },
            selected: true,
            data: {
              type: inferredType,
              kind: def.kind,
              title,
              values: newValues,
            },
          }

          const newEdge: Edge = {
            id: crypto.randomUUID(),
            source: sourceNode.id,
            target: newId,
            type: "smoothstep",
          }

          onNodesChange([
            ...nodes
              .filter((n) => n.selected)
              .map((n) => ({
                type: "select" as const,
                id: n.id,
                selected: false,
              })),
            { type: "add", item: newNode },
          ])
          onEdgesChange([{ type: "add", item: newEdge }])
          window.setTimeout(
            () => void fitView({ padding: 0.25, duration: 300 }),
            80
          )

          const detailPreview =
            newValues.url ||
            newValues.instruction ||
            newValues.query ||
            newValues.city ||
            ""
          return `Connected "${sourceNode.data.title}" → "${title}"${detailPreview ? ` (${detailPreview})` : ""}`
        }
      }
    }

    // -------------------------------------------------------------------------
    // 4. ADD / CREATE A SINGLE NODE (OPTIONALLY AUTO-CONNECTING TO PREVIOUS)
    //    e.g., "add start node", "add open url node and open google.com",
    //    "add extract node to extract pricing"
    // -------------------------------------------------------------------------
    if (
      /^(?:add|create|insert|new|then\s+add)\b/i.test(clean) ||
      (clean.split(/\s+/).length <= 9 && detectNodeTypeFromPhrase(clean) !== null)
    ) {
      const detectedType = detectNodeTypeFromPhrase(clean)
      if (detectedType) {
        saveSnapshot()
        const def = nodeRegistry[detectedType]

        // Handle Start / Schedule trigger node
        if (def.kind === "trigger") {
          const existingTrigger = nodes.find((n) => n.data.kind === "trigger")
          const triggerValues = extractInitialValuesFromSpeech(
            detectedType,
            clean
          )
          if (existingTrigger) {
            const replacement: StepNodeType = {
              ...existingTrigger,
              selected: true,
              data: {
                ...existingTrigger.data,
                type: detectedType,
                title: detectedType === "schedule" ? "Schedule" : "Start",
                values: triggerValues,
              },
            }
            onNodesChange([
              { type: "replace", id: existingTrigger.id, item: replacement },
            ])
            return `Ready: "${replacement.data.title}" trigger node on canvas`
          } else {
            const startNode: StepNodeType = {
              id: "start",
              type: "step",
              position: { x: 0, y: 0 },
              selected: true,
              data: {
                type: detectedType,
                kind: "trigger",
                title: detectedType === "schedule" ? "Schedule" : "Start",
                values: triggerValues,
              },
            }
            onNodesChange([{ type: "add", item: startNode }])
            window.setTimeout(
              () => void fitView({ padding: 0.25, duration: 300 }),
              80
            )
            return `Added "${startNode.data.title}" trigger node`
          }
        }

        // Action node: place to the right of the selected node or rightmost node
        const anchorNode =
          selectedNode ?? orderedNodes[orderedNodes.length - 1]
        const sameTypeCount = nodes.filter(
          (n) => n.data.type === detectedType
        ).length
        const title =
          sameTypeCount === 0
            ? def.label
            : `${def.label} ${sameTypeCount + 1}`
        const newId = crypto.randomUUID()
        const newValues = extractInitialValuesFromSpeech(
          detectedType,
          clean,
          anchorNode
        )

        const newNode: StepNodeType = {
          id: newId,
          type: "step",
          position: {
            x: anchorNode ? anchorNode.position.x + 280 : 280,
            y: anchorNode ? anchorNode.position.y : 0,
          },
          selected: true,
          data: {
            type: detectedType,
            kind: def.kind,
            title,
            values: newValues,
          },
        }

        const shouldAutoConnect =
          anchorNode &&
          !/\b(?:disconnected|unconnected|without\s+connecting)\b/i.test(lower)

        onNodesChange([
          ...nodes
            .filter((n) => n.selected)
            .map((n) => ({
              type: "select" as const,
              id: n.id,
              selected: false,
            })),
          { type: "add", item: newNode },
        ])

        if (shouldAutoConnect && anchorNode) {
          onEdgesChange([
            {
              type: "add",
              item: {
                id: crypto.randomUUID(),
                source: anchorNode.id,
                target: newId,
                type: "smoothstep",
              },
            },
          ])
        }

        window.setTimeout(
          () => void fitView({ padding: 0.25, duration: 300 }),
          80
        )

        const detailPreview =
          newValues.url ||
          newValues.instruction ||
          newValues.query ||
          newValues.city ||
          ""
        return shouldAutoConnect && anchorNode
          ? `Added "${title}" & connected from "${anchorNode.data.title}"${detailPreview ? ` (${detailPreview})` : ""}`
          : `Added "${title}"${detailPreview ? ` (${detailPreview})` : ""}`
      }
    }

    return null
  }

  const executeVoiceCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim()
    if (!trimmed || isPending) return

    if (autoSubmitTimerRef.current) {
      window.clearTimeout(autoSubmitTimerRef.current)
      autoSubmitTimerRef.current = null
    }
    setDictationCaptured(false)

    // 1. First try instant step-by-step canvas execution (Add node, Connect nodes, Edit node field)
    const stepSummary = tryExecuteIncrementalCommand(trimmed)
    if (stepSummary) {
      setVoiceText("")
      lastLengthRef.current = 0
      pushLog(trimmed, stepSummary, "step")
      toast.success(stepSummary)
      return
    }

    // 2. Otherwise fall back to full AI workflow builder for multi-step natural language prompts
    const scopedPrompt = selectedNode
      ? `For step "${selectedNode.data.title}" (${selectedNode.data.type}): ${trimmed}`
      : trimmed

    startTransition(async () => {
      try {
        const response = await fetch("/api/workflows/ai-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: scopedPrompt }],
            currentGraph: toEditableWorkflow({ nodes, edges }),
          }),
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Could not build workflow from voice.")
        }

        if (result.graph) {
          applyFullGraphToCanvas(result.graph as WorkflowGraph)
          setVoiceText("")
          lastLengthRef.current = 0
          const summary =
            result.reply || "Built multi-step workflow on canvas."
          pushLog(trimmed, summary, "ai")
          toast.success("Wispr Flow AI pipeline applied to canvas!")
        } else {
          const reply = result.reply || "Need more details to finish this step."
          pushLog(trimmed, reply, "ai")
          toast.info(reply)
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Voice command failed."
        toast.error(message)
      }
    })
  }

  const handleInputChange = (nextValue: string) => {
    const delta = nextValue.length - lastLengthRef.current
    lastLengthRef.current = nextValue.length
    setVoiceText(nextValue)

    if (autoSubmitTimerRef.current) {
      window.clearTimeout(autoSubmitTimerRef.current)
      autoSubmitTimerRef.current = null
    }

    // Wispr Flow Desktop injects the spoken phrase in a single burst (even short
    // commands like "Add start node" are >= 8 chars).
    if (autoExecuteOnDictation && delta >= 8 && nextValue.trim().length >= 8) {
      setDictationCaptured(true)
      autoSubmitTimerRef.current = window.setTimeout(() => {
        executeVoiceCommand(nextValue)
      }, 750)
    } else {
      setDictationCaptured(false)
    }
  }

  const handleUndo = () => {
    if (!previousGraph) return
    const snapshot = previousGraph
    setPreviousGraph(null)
    applyFullGraphToCanvas(snapshot)
    toast.success("Undid last voice canvas command")
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true)
          window.setTimeout(() => inputRef.current?.focus(), 40)
        }}
        className="group flex items-center gap-2 rounded-full border border-violet-500/35 bg-card/95 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-all hover:border-violet-500 hover:bg-accent"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-violet-500" />
        </span>
        <AudioLines className="size-3.5 text-violet-500" />
        <span>Speak with Wispr Flow</span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>
    )
  }

  return (
    <div className="w-[min(92vw,42rem)] rounded-2xl border border-violet-500/40 bg-card/95 p-3 shadow-2xl backdrop-blur-md">
      {/* Header Row */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-violet-500/15 text-violet-500">
            <AudioLines className="size-3.5" />
          </span>
          <span className="text-xs font-semibold text-foreground">
            Wispr Flow Step-by-Step Voice Studio
          </span>
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-300">
            Add · Connect · Edit Nodes by Voice
          </span>
          {selectedNode && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300">
              <Crosshair className="size-2.5" />
              Active: {selectedNode.data.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {previousGraph && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="size-2.5" />
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={() => setAutoExecuteOnDictation((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
              autoExecuteOnDictation
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                : "border-border bg-muted/40 text-muted-foreground"
            )}
            title="Automatically execute command as soon as Wispr Flow finishes pasting your speech"
          >
            <Zap className="size-2.5" />
            {autoExecuteOnDictation ? "Auto-Execute On" : "Auto-Execute Off"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close Wispr Flow Voice Bar"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Dictation Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          executeVoiceCommand(voiceText)
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Mic
            className={cn(
              "pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2",
              dictationCaptured || isPending
                ? "animate-pulse text-violet-500"
                : "text-muted-foreground"
            )}
          />
          <input
            ref={inputRef}
            type="text"
            value={voiceText}
            disabled={isPending}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              selectedNode
                ? `Speak e.g. "Connect with open link node and open google.com" or "Change URL to wikipedia.org"`
                : `Speak step-by-step: "Add start node", "Connect start node with open link node and open google.com"...`
            }
            className="h-9 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-xs text-foreground outline-none transition-colors focus:border-violet-500"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!voiceText.trim() || isPending}
          className="h-9 gap-1.5 px-3"
        >
          {isPending ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Send className="size-3.5" />
              Run
            </>
          )}
        </Button>
      </form>

      {/* Dictation Countdown Banner */}
      {dictationCaptured && !isPending && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3 animate-spin" />
            Wispr Flow dictation detected — executing on canvas...
          </span>
          <button
            type="button"
            onClick={() => {
              if (autoSubmitTimerRef.current) {
                window.clearTimeout(autoSubmitTimerRef.current)
                autoSubmitTimerRef.current = null
              }
              setDictationCaptured(false)
            }}
            className="underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Step-by-Step Voice Command Log */}
      {logs.length > 0 && (
        <div className="mt-2 space-y-1 rounded-lg border border-border/70 bg-muted/30 p-2">
          <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            <span>Recent Voice Commands</span>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-[10px] font-normal hover:underline"
            >
              Clear log
            </button>
          </div>
          {logs.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                <span className="truncate font-medium">
                  {item.actionSummary}
                </span>
              </span>
              <span className="shrink-0 rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-500">
                {item.mode === "step" ? "Instant Step" : "AI Pipeline"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Example Step-by-Step Voice Chips */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Wand2 className="size-2.5 text-violet-500" />
          Step commands:
        </span>
        {STEP_VOICE_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              executeVoiceCommand(ex)
              inputRef.current?.focus()
            }}
            className="max-w-60 truncate rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-foreground"
            title={`Click or speak: "${ex}"`}
          >
            &ldquo;{ex}&rdquo;
          </button>
        ))}
      </div>
    </div>
  )
}
