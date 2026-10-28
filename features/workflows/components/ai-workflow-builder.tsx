"use client"

import { useState, useTransition } from "react"
import {
  useReactFlow,
  useStore,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react"
import { useWorkflowFlow } from "@/features/workflows/components/workflow-flow-provider"
import {
  Bot,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Crosshair,
  HelpCircle,
  LoaderCircle,
  Mail,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  Workflow,
  X,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { WorkflowGraph } from "@/lib/db/schema"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

type ChatMessage = { role: "user" | "assistant"; content: string }

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Tell me what you want to automate, or select any node on the canvas to refine it. You can also toggle Live Sync to apply changes immediately.",
  },
]

const suggestions = [
  "Every morning at 9am, find local places based on Radiohead & email me",
  "Open a competitor pricing page, extract plans, and send a summary email",
  "Find lifestyle brands aligned with Studio Ghibli and research the top pick",
]

const quickActions = [
  {
    label: "Explain workflow",
    icon: HelpCircle,
    prompt:
      "Explain step by step what this current workflow does and check if any node settings could be improved.",
  },
  {
    label: "Optimize prompts",
    icon: Wand2,
    prompt:
      "Rewrite and sharpen the browser action and extraction instructions across all nodes so they are clearer and more reliable.",
  },
  {
    label: "Add email digest",
    icon: Mail,
    prompt:
      "Add a Send Email step at the end of this workflow that summarizes the outputs from the previous steps.",
  },
  {
    label: "Switch to schedule",
    icon: CalendarClock,
    prompt:
      "Change the trigger of this workflow to run on a daily schedule at 09:00.",
  },
]

function NodeBadge({ type }: { type: NodeType }) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded",
        def.accent
      )}
    >
      <Icon className="size-3" />
    </span>
  )
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

type DiffStatus = "unchanged" | "modified" | "added"

function getStepDiffStatus(
  draftNode: StepNodeType,
  index: number,
  orderedExistingNodes: StepNodeType[]
): DiffStatus {
  const existing = orderedExistingNodes[index]
  if (!existing || existing.data.type !== draftNode.data.type) {
    return "added"
  }
  if (existing.data.title !== draftNode.data.title) {
    return "modified"
  }
  const draftKeys = Object.keys(draftNode.data.values)
  const existingKeys = Object.keys(existing.data.values)
  if (draftKeys.length !== existingKeys.length) {
    return "modified"
  }
  for (const key of draftKeys) {
    if (draftNode.data.values[key] !== existing.data.values[key]) {
      return "modified"
    }
  }
  return "unchanged"
}

export function AiWorkflowBuilder() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [prompt, setPrompt] = useState("")
  const [draft, setDraft] = useState<WorkflowGraph | null>(null)
  const [previousGraph, setPreviousGraph] = useState<WorkflowGraph | null>(null)
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>([])
  const [autoApply, setAutoApply] = useState(false)
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { fitView } = useReactFlow<StepNodeType>()
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useWorkflowFlow()

  const selectedNode = useStore((s) =>
    s.nodes.find((n) => n.selected)
  ) as StepNodeType | undefined

  const commitGraphToCanvas = (
    targetGraph: WorkflowGraph,
    options?: { skipConfirm?: boolean; saveSnapshot?: boolean }
  ) => {
    const hasCanvasWork =
      edges.length > 0 || nodes.some((node) => node.data.type !== "start")
    if (
      !options?.skipConfirm &&
      hasCanvasWork &&
      !window.confirm("Apply this AI workflow update to the canvas?")
    ) {
      return false
    }

    if (options?.saveSnapshot !== false) {
      setPreviousGraph({
        nodes: structuredClone(nodes),
        edges: structuredClone(edges),
      })
    }

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
    return true
  }

  const sendMessage = (message = prompt) => {
    const content = message.trim()
    if (!content || isPending) return

    const nextMessages = [...messages, { role: "user" as const, content }]
    setMessages(nextMessages)
    setPrompt("")
    setFollowUpPrompts([])

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
        if (!response.ok) {
          throw new Error(result.error || "Could not generate a workflow.")
        }

        if (Array.isArray(result.followUpPrompts)) {
          setFollowUpPrompts(result.followUpPrompts)
        }

        if (result.graph) {
          const generatedGraph = result.graph as WorkflowGraph
          if (autoApply) {
            commitGraphToCanvas(generatedGraph, { skipConfirm: true })
            setDraft(null)
            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                content: `${result.reply || "Updated your workflow."} (Live-synced to canvas)`,
              },
            ])
          } else {
            setDraft(generatedGraph)
            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                content: result.reply || "I’ve prepared a workflow draft.",
              },
            ])
          }
        } else {
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content: result.reply || "Let me know how you’d like to proceed.",
            },
          ])
        }
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.",
          },
        ])
      }
    })
  }

  const applyDraft = () => {
    if (!draft) return
    const applied = commitGraphToCanvas(draft)
    if (!applied) return
    setDraft(null)
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content:
          "Updated the workflow on your canvas. Review the node settings, then save or run it when you’re ready.",
      },
    ])
  }

  const handleUndo = () => {
    if (!previousGraph) return
    commitGraphToCanvas(previousGraph, {
      skipConfirm: true,
      saveSnapshot: false,
    })
    setPreviousGraph(null)
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: "Reverted the canvas to the previous workflow state.",
      },
    ])
  }

  const resetChat = () => {
    setMessages(initialMessages)
    setDraft(null)
    setFollowUpPrompts([])
    setPrompt("")
  }

  const orderedExistingNodes = [...nodes].sort(
    (a, b) => a.position.x - b.position.x
  )
  const nodesToEdit =
    draft?.nodes ??
    orderedExistingNodes.filter((node) => node.data.type !== "start")

  const requestNodeEdit = (node: StepNodeType) => {
    const label = node.data.title || nodeRegistry[node.data.type].label
    setPrompt(`Update the “${label}” (${nodeRegistry[node.data.type].label}) node: `)
  }

  const hasCanvasWork =
    edges.length > 0 || nodes.some((node) => node.data.type !== "start")

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header with Live Sync toggle and Clear Chat */}
      <div className="flex items-center justify-between gap-2 border-y border-border bg-card px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" />
          <span>AI Agent Builder</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoApply((v) => !v)}
            title="When enabled, AI edits update the canvas immediately without waiting in a draft."
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
              autoApply
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="size-2.5" />
            {autoApply ? "Live Sync On" : "Draft Mode"}
          </button>
          {(messages.length > 1 || draft) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground"
              title="Reset conversation"
              onClick={resetChat}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Selected Canvas Node Context Pill */}
      {selectedNode && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-accent/40 px-3 py-1.5 text-xs">
          <div className="flex min-w-0 items-center gap-1.5">
            <Crosshair className="size-3.5 shrink-0 text-primary" />
            <span className="truncate font-medium">
              Selected: {selectedNode.data.title || nodeRegistry[selectedNode.data.type].label}
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-6 shrink-0 px-2 text-[10px]"
            onClick={() => requestNodeEdit(selectedNode)}
          >
            <Pencil className="size-2.5" /> Target in prompt
          </Button>
        </div>
      )}

      {/* Quick AI Action Chips when workflow has steps */}
      {hasCanvasWork && (
        <div className="flex flex-wrap gap-1 border-b border-border bg-muted/20 px-3 py-2">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                type="button"
                disabled={isPending}
                onClick={() => sendMessage(action.prompt)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                <Icon className="size-3 text-primary" />
                {action.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Scrollable Chat & Draft Inspector */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "ml-5 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
                : "mr-2 flex gap-2 rounded-lg bg-muted px-3 py-2 text-xs"
            }
          >
            {message.role === "assistant" && (
              <Bot className="mt-0.5 size-3.5 shrink-0 text-primary" />
            )}
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>
        ))}

        {isPending && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin text-primary" />
            <span>Synthesizing workflow steps…</span>
          </div>
        )}

        {/* Undo banner after applying a draft */}
        {previousGraph && !draft && !isPending && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-[11px]">
            <span className="text-muted-foreground">
              Canvas updated by AI
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={handleUndo}
            >
              <RotateCcw className="size-3" /> Undo last AI apply
            </Button>
          </div>
        )}

        {/* Rich Interactive Draft Card with Diff Badges & Expandable Values */}
        {draft && (
          <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Workflow className="size-3.5 text-primary" />
                <span>Proposed Draft · {draft.nodes.length} steps</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5 text-muted-foreground hover:text-foreground"
                title="Discard draft"
                onClick={() => setDraft(null)}
              >
                <X className="size-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              {draft.nodes.map((node, index) => {
                const status = getStepDiffStatus(
                  node,
                  index,
                  orderedExistingNodes
                )
                const isExpanded = expandedNodeId === node.id
                const valueEntries = Object.entries(node.data.values)

                return (
                  <div
                    key={node.id}
                    className="rounded-md border border-border/80 bg-background/90 p-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedNodeId(isExpanded ? null : node.id)
                        }
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      >
                        {valueEntries.length > 0 ? (
                          isExpanded ? (
                            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                          )
                        ) : (
                          <span className="w-3 shrink-0" />
                        )}
                        <NodeBadge type={node.data.type} />
                        <span className="truncate font-medium">
                          {index + 1}.{" "}
                          {node.data.title ||
                            nodeRegistry[node.data.type].label}
                        </span>
                      </button>

                      <div className="flex items-center gap-1">
                        {status === "added" && (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                            New
                          </span>
                        )}
                        {status === "modified" && (
                          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                            Edited
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0"
                          title="Edit this step in chat"
                          onClick={() => requestNodeEdit(node)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && valueEntries.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-border/60 pt-1.5 text-[11px]">
                        {valueEntries.map(([key, val]) => (
                          <div
                            key={key}
                            className="flex flex-col gap-0.5 rounded bg-muted/50 px-2 py-1"
                          >
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {key}
                            </span>
                            <span className="break-words text-foreground">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-1.5 pt-1">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={applyDraft}
              >
                <Check className="size-3.5" />
                {hasCanvasWork ? "Apply to canvas" : "Build on canvas"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDraft(null)}
              >
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* AI Follow-Up Refinement Suggestions */}
        {followUpPrompts.length > 0 && !isPending && (
          <div className="space-y-1 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested next steps
            </p>
            <div className="flex flex-col gap-1">
              {followUpPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => sendMessage(item)}
                  className="flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
                >
                  <Sparkles className="size-3 shrink-0 text-primary" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Canvas Nodes List when no draft is active */}
        {!draft && nodesToEdit.length > 0 && (
          <div className="space-y-1.5 rounded-lg border p-3">
            <p className="text-xs font-semibold">
              Canvas nodes ({nodesToEdit.length})
            </p>
            <div className="space-y-1">
              {nodesToEdit.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between gap-1.5 rounded-md px-1.5 py-1 text-xs hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <NodeBadge type={node.data.type} />
                    <span className="truncate text-muted-foreground">
                      {node.data.title || nodeRegistry[node.data.type].label}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 shrink-0 px-1.5 text-[10px]"
                    onClick={() => requestNodeEdit(node)}
                  >
                    <Pencil className="size-2.5" /> Edit
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Starter suggestions for a brand new conversation */}
        {messages.length === 1 && !isPending && !hasCanvasWork && (
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Try an example prompt
            </p>
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start whitespace-normal rounded-md border border-transparent px-2.5 py-1.5 text-left text-[11px] text-muted-foreground hover:border-border"
                onClick={() => sendMessage(suggestion)}
              >
                <Sparkles className="mr-1.5 size-3 shrink-0 text-primary" />
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Input Footer */}
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
          placeholder={
            selectedNode
              ? `Ask AI to edit “${selectedNode.data.title || nodeRegistry[selectedNode.data.type].label}” or the whole workflow…`
              : "Describe your workflow or ask to edit any step…"
          }
          maxLength={2000}
          rows={3}
          disabled={isPending}
          className="resize-none text-xs"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            Enter to send · Shift+Enter for newline
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !prompt.trim()}
          >
            {isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
