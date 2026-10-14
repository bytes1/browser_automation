"use client"

import { useState, useTransition } from "react"
import { useReactFlow, useStore, type Edge } from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { Bot, CalendarClock, Layers, MapPin, MoreHorizontal, Play, Sparkles, Trash2, Unlink } from "lucide-react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

import {
  deleteWorkflowAction,
  runWorkflowAction,
  saveWorkflowScheduleAction,
} from "@/features/workflows/actions"
import { useWatchWorkflowRun } from "@/features/workflows/components/workflow-runs-provider"
import { AiWorkflowBuilder } from "@/features/workflows/components/ai-workflow-builder"
import { useUpstreamConnections } from "@/features/workflows/hooks/use-upstream-connections"
import { validateGraph } from "@/features/workflows/lib/validate-graph"
import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// The accent-colored icon chip, mirroring the node on the canvas.
function NodeIcon({ type, className }: { type: NodeType; className?: string }) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

// A titled, scrollable panel. Each tab renders its content inside one.
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor tab — edits the fields of the selected node.
// ---------------------------------------------------------------------------

// A single editor field for a node property. Renders a multi-line textarea when
// the field opts in via `multiline`, otherwise a single-line input.
function Field({
  field,
  value,
  onChange,
  onFocus,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
  // Fires when the field gains focus, so the Connections chips know which
  // field a clicked token should land in.
  onFocus: () => void
}) {
  if (field.options) {
    return (
      <NativeSelect
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
        size="sm"
      >
        {field.options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    )
  }

  if (field.multiline) {
    return (
      <Textarea
        id={field.key}
        value={value}
        placeholder={field.placeholder}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <Input
      id={field.key}
      type={field.inputType ?? "text"}
      value={value}
      placeholder={field.placeholder}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData, deleteElements, getNode } =
    useReactFlow<StepNodeType>()
  const edges = useStore((s) => s.edges)
  // Outputs of every node upstream of the selected one, as insertable {{ }}
  // tokens. Empty when nothing feeds into this node.
  const connections = useUpstreamConnections()
  // The field a clicked chip inserts into — whichever was focused most recently.
  // Reset per selected node since this component is keyed by node id.
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null)

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]
  const links = edges.filter(
    (edge) => edge.source === node.id || edge.target === node.id
  )

  // Untouched fields fall back to the first one, so a chip always has a home.
  const targetKey = activeFieldKey ?? def.fields[0]?.key

  const insertToken = (token: string) => {
    if (!targetKey) return
    updateNodeData(node.id, {
      values: { ...values, [targetKey]: (values[targetKey] ?? "") + token },
    })
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields
            .filter((field) => {
              if (!field.showWhen) return true
              const selectedValue =
                values[field.showWhen.field] ??
                (field.showWhen.field === "frequency" && values.cron
                  ? "custom"
                  : "")
              return selectedValue === field.showWhen.value
            })
            .map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key} className="text-xs">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Field
                field={field}
                value={
                  values[field.key] ??
                  (field.key === "frequency" && values.cron
                    ? "custom"
                    : field.defaultValue ?? "")
                }
                onFocus={() => setActiveFieldKey(field.key)}
                onChange={(value) => {
                  const nextValues = { ...values, [field.key]: value }
                  if (field.key === "frequency") {
                    for (const definition of def.fields) {
                      if (
                        definition.defaultValue !== undefined &&
                        nextValues[definition.key] === undefined
                      ) {
                        nextValues[definition.key] = definition.defaultValue
                      }
                    }
                    if (value === "custom" && !nextValues.cron) {
                      nextValues.cron = "0 9 * * *"
                    }
                  }
                  updateNodeData(node.id, {
                    values: nextValues,
                  })
                }}
              />
            </div>
          ))
        )}

        {/* Available upstream outputs — click to drop a token into the last
            focused field (or the first field if none has been touched). */}
        {connections.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Connections</Label>
            <div className="flex flex-wrap gap-1.5">
              {connections.map((connection) => (
                <button
                  key={connection.token}
                  type="button"
                  onClick={() => insertToken(connection.token)}
                  className="flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-1.5 py-1 text-xs hover:bg-accent"
                >
                  <NodeIcon type={connection.nodeType} className="size-4" />
                  <span className="truncate">{connection.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Linked nodes</Label>
            <div className="flex flex-col gap-1">
              {links.map((edge) => {
                const isIncoming = edge.target === node.id
                const otherNode = getNode(
                  isIncoming ? edge.source : edge.target
                )
                const relation = isIncoming ? "From" : "To"

                return (
                  <div
                    key={edge.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5"
                  >
                    <span className="min-w-0 truncate text-xs">
                      <span className="text-muted-foreground">{relation} </span>
                      {otherNode?.data.title ?? "Unknown node"}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0"
                      aria-label={`Unlink ${relation.toLowerCase()} ${otherNode?.data.title ?? "node"}`}
                      title={`Unlink ${relation.toLowerCase()} ${otherNode?.data.title ?? "node"}`}
                      onClick={() => {
                        void deleteElements({ edges: [{ id: edge.id }] })
                      }}
                    >
                      <Unlink />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-3">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              void deleteElements({ nodes: [{ id: node.id }] })
            }}
          >
            <Trash2 />
            Delete node
          </Button>
        </div>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Toolbar tab — adds nodes to the canvas, grouped by kind.
// ---------------------------------------------------------------------------

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below.
const definitions = Object.values(nodeRegistry)

// The Toolbar tab: a button per node type that adds it to the canvas.
function Palette() {
  // The shared React Flow store (lifted to a provider above the canvas and this
  // sidebar) lets us read the current nodes/viewport and add to them from here.
  const { getNodes, getEdges, getViewport, addNodes, fitView } =
    useReactFlow<StepNodeType>()
  const { onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<StepNodeType, Edge>()
  // The pane's measured size, used to find the center of the current view.
  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)

  const replaceGraph = (nodes: StepNodeType[], edges: Edge[]) => {
    // React Flow's setNodes/setEdges only update its local store. The canvas is
    // controlled by Liveblocks, so replace the graph through its sync handlers.
    onDelete({ nodes: getNodes(), edges: getEdges() })
    onNodesChange(nodes.map((item) => ({ type: "add" as const, item })))
    onEdgesChange(edges.map((item) => ({ type: "add" as const, item })))
  }

  const loadTemplate = (templateType: "concierge" | "cross-domain" | "local") => {
    const existing = getNodes()
    const isCustomized = existing.some(
      (n) => n.id !== "start" && n.data?.type !== "start"
    )
    if (isCustomized) {
      toast.error(
        "Please clear the canvas or create a new workflow before loading a template."
      )
      return
    }

    const { x, y, zoom } = getViewport()
    const center = { x: (width / 2 - x) / zoom, y: (height / 2 - y) / zoom }

    if (templateType === "concierge") {
      const startId = crypto.randomUUID()
      const seedsId = crypto.randomUUID()
      const localId = crypto.randomUUID()
      const browseId = crypto.randomUUID()
      const emailId = crypto.randomUUID()

      const newNodes: StepNodeType[] = [
        {
          id: startId,
          type: "step",
          position: { x: center.x - 560, y: center.y },
          data: { type: "start", kind: "trigger", title: "Start", values: {} },
        },
        {
          id: seedsId,
          type: "step",
          position: { x: center.x - 280, y: center.y },
          data: {
            type: "qloo-search",
            kind: "action",
            title: "Taste Seeds (Multi-Domain)",
            values: {
              query: "Radiohead, Haruki Murakami",
              entityType: "any",
            },
          },
        },
        {
          id: localId,
          type: "step",
          position: { x: center.x, y: center.y },
          data: {
            type: "qloo-local",
            kind: "action",
            title: "Discover Tokyo Venues",
            values: {
              entityIds: `{{ ${seedsId}.entityIds }}`,
              city: "Tokyo",
              limit: "5",
            },
          },
        },
        {
          id: browseId,
          type: "step",
          position: { x: center.x + 280, y: center.y },
          data: {
            type: "open-url",
            kind: "action",
            title: "Autonomous Web Agent",
            values: {
              url: `https://www.google.com/search?q={{ ${localId}.topPickName }}+Tokyo`,
            },
          },
        },
        {
          id: emailId,
          type: "step",
          position: { x: center.x + 560, y: center.y },
          data: {
            type: "send-email",
            kind: "action",
            title: "Deliver VIP Itinerary",
            values: {
              to: "curator@example.com",
              subject: `Cultural Itinerary: {{ ${localId}.topPickName }} & Tokyo Spots`,
              body: `Hello,\n\nHere is your bespoke cultural itinerary powered by Qloo Taste Intelligence:\n\n⭐ Top Pick: {{ ${localId}.topPickName }}\nAffinity / Rationale: {{ ${localId}.topPickReason }}\n\nCurated Recommendations:\n{{ ${localId}.summary }}\n\nVerified via Autonomous Web Agent.\nEnjoy!`,
            },
          },
        },
      ]

      const newEdges = [
        { id: crypto.randomUUID(), source: startId, target: seedsId },
        { id: crypto.randomUUID(), source: seedsId, target: localId },
        { id: crypto.randomUUID(), source: localId, target: browseId },
        { id: crypto.randomUUID(), source: browseId, target: emailId },
      ]

      replaceGraph(newNodes, newEdges)
      setTimeout(() => fitView({ padding: 0.15 }), 50)
      toast.success("Loaded 'Autonomous Cultural Concierge' template!")
    } else if (templateType === "cross-domain") {
      const startId = crypto.randomUUID()
      const seedsId = crypto.randomUUID()
      const recsId = crypto.randomUUID()
      const emailId = crypto.randomUUID()

      const newNodes: StepNodeType[] = [
        {
          id: startId,
          type: "step",
          position: { x: center.x - 420, y: center.y },
          data: { type: "start", kind: "trigger", title: "Start", values: {} },
        },
        {
          id: seedsId,
          type: "step",
          position: { x: center.x - 140, y: center.y },
          data: {
            type: "qloo-search",
            kind: "action",
            title: "Cinema Aesthetic Seeds",
            values: {
              query: "Wes Anderson, Studio Ghibli",
              entityType: "urn:entity:movie",
            },
          },
        },
        {
          id: recsId,
          type: "step",
          position: { x: center.x + 140, y: center.y },
          data: {
            type: "qloo-recommend",
            kind: "action",
            title: "Aligned Lifestyle Brands",
            values: {
              entityIds: `{{ ${seedsId}.entityIds }}`,
              targetType: "urn:entity:brand",
              city: "",
              limit: "6",
            },
          },
        },
        {
          id: emailId,
          type: "step",
          position: { x: center.x + 420, y: center.y },
          data: {
            type: "send-email",
            kind: "action",
            title: "Email Aesthetic Report",
            values: {
              to: "curator@example.com",
              subject: "Cross-Domain Brand Affinity Report",
              body: `Cross-domain taste analysis powered by Qloo Taste Intelligence:\n\nTop Pick: {{ ${recsId}.topPickName }}\nWhy: {{ ${recsId}.topPickReason }}\n\nRecommendations:\n{{ ${recsId}.summary }}`,
            },
          },
        },
      ]

      const newEdges = [
        { id: crypto.randomUUID(), source: startId, target: seedsId },
        { id: crypto.randomUUID(), source: seedsId, target: recsId },
        { id: crypto.randomUUID(), source: recsId, target: emailId },
      ]

      replaceGraph(newNodes, newEdges)
      setTimeout(() => fitView({ padding: 0.15 }), 50)
      toast.success("Loaded 'Cross-Domain Taste Scout' template!")
    } else {
      const startId = crypto.randomUUID()
      const seedsId = crypto.randomUUID()
      const localId = crypto.randomUUID()

      const newNodes: StepNodeType[] = [
        {
          id: startId,
          type: "step",
          position: { x: center.x - 300, y: center.y },
          data: { type: "start", kind: "trigger", title: "Start", values: {} },
        },
        {
          id: seedsId,
          type: "step",
          position: { x: center.x, y: center.y },
          data: {
            type: "qloo-search",
            kind: "action",
            title: "Favorite Artist",
            values: { query: "Radiohead", entityType: "urn:entity:artist" },
          },
        },
        {
          id: localId,
          type: "step",
          position: { x: center.x + 300, y: center.y },
          data: {
            type: "qloo-local",
            kind: "action",
            title: "Discover New York Places",
            values: {
              entityIds: `{{ ${seedsId}.entityIds }}`,
              city: "New York",
              limit: "8",
            },
          },
        },
      ]

      const newEdges = [
        { id: crypto.randomUUID(), source: startId, target: seedsId },
        { id: crypto.randomUUID(), source: seedsId, target: localId },
      ]

      replaceGraph(newNodes, newEdges)
      setTimeout(() => fitView({ padding: 0.15 }), 50)
      toast.success("Loaded 'Local Discovery' template!")
    }
  }

  const add = (type: NodeType) => {
    const def = nodeRegistry[type]
    const nodes = getNodes()
    const existingTrigger = nodes.find((node) => node.data.kind === "trigger")

    // Start and Schedule are alternate configurations of the same entry point.
    if (def.kind === "trigger" && existingTrigger) {
      if (
        (existingTrigger.data.type === "start" ||
          existingTrigger.data.type === "schedule") &&
        (type === "start" || type === "schedule")
      ) {
        const values = Object.fromEntries(
          (def.fields as NodeField[])
            .filter((field) => field.defaultValue !== undefined)
            .map((field) => [field.key, field.defaultValue!])
        )
        const replacement: StepNodeType = {
          ...existingTrigger,
          data: {
            ...existingTrigger.data,
            type,
            title: type === "schedule" ? "Schedule" : "Start",
            values,
          },
        }
        onNodesChange([
          { type: "replace", id: replacement.id, item: replacement },
        ])
        return
      }

      toast.error("A workflow can only have one trigger.")
      return
    }

    // Number nodes of the same type (e.g. "Open URL 1", "Open URL 2") so
    // duplicates stay easy to tell apart.
    const count = nodes.filter((n) => n.data.type === type).length
    const title = `${def.label} ${count + 1}`

    // Drop the node in the middle of the current view. The viewport transform
    // maps a flow point p to the screen as p * zoom + {x, y}, so the pane center
    // in flow coordinates is (center - offset) / zoom.
    const { x, y, zoom } = getViewport()
    const position = {
      x: (width / 2 - x) / zoom,
      y: (height / 2 - y) / zoom,
    }

    addNodes({
      id: crypto.randomUUID(),
      type: "step",
      position,
      data: {
        type,
        kind: def.kind,
        title,
        values: Object.fromEntries(
          (def.fields as NodeField[])
            .filter((field) => field.defaultValue !== undefined)
            .map((field) => [field.key, field.defaultValue!])
        ),
      },
    })
  }

  return (
    <Section title="Toolbar">
      <div className="border-b border-border p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-fuchsia-500" />
            <span>Qloo Hackathon Templates</span>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full justify-start text-xs font-medium"
          onClick={() => loadTemplate("concierge")}
        >
          <Sparkles className="size-3.5 text-fuchsia-500 shrink-0" />
          <span className="truncate">Autonomous Cultural Concierge</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs font-medium"
          onClick={() => loadTemplate("cross-domain")}
        >
          <Layers className="size-3.5 text-violet-500 shrink-0" />
          <span className="truncate">Cross-Domain Taste Scout</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground"
          onClick={() => loadTemplate("local")}
        >
          <MapPin className="size-3.5 text-rose-500 shrink-0" />
          <span className="truncate">Local Places Explorer</span>
        </Button>
      </div>
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => (
                  <Button
                    key={def.type}
                    variant="ghost"
                    onClick={() => add(def.type as NodeType)}
                    className="justify-start gap-2.5 px-1.5 text-xs"
                  >
                    <NodeIcon type={def.type as NodeType} />
                    {def.label}
                  </Button>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

// The "..." menu for workflow-level actions.
function ActionsMenu({ workflowId }: { workflowId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          className="text-xs [&_svg:not([class*='size-'])]:size-3.5"
          onSelect={(e) => {
            // Keep the menu mounted while the delete runs so the disabled state
            // stays visible. Running inside a transition lets the router handle
            // the action's redirect home on success.
            e.preventDefault()
            startTransition(async () => {
              await deleteWorkflowAction(workflowId)
            })
          }}
        >
          <Trash2 />
          Delete workflow
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Kicks off a run of the current workflow.
function RunButton({ workflowId }: { workflowId: string }) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const watchRun = useWatchWorkflowRun()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={isPending}
      onClick={() => {
        // TODO: validate the graph and run the workflow (toggle to Stop while running).
        const graph = { nodes: getNodes(), edges: getEdges() }
        const problems = validateGraph(graph)
        if (problems.length > 0) {
          toast.error(problems[0])
          return
        }

        startTransition(async () => {
          const run = await runWorkflowAction({ id: workflowId, graph })
          watchRun(run.runId, run.accessToken)
        })
      }}
    >
      <Play fill="primary" />
      Run
    </Button>
  )
}

function ScheduleButton({ workflowId }: { workflowId: string }) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        const graph = { nodes: getNodes(), edges: getEdges() }
        const problems = validateGraph(graph)
        if (problems.length > 0) {
          toast.error(problems[0])
          return
        }

        startTransition(async () => {
          try {
            const result = await saveWorkflowScheduleAction({ id: workflowId, graph })
            toast.success(
              result.scheduled
                ? result.mode === "once"
                  ? `One-time run scheduled${result.nextRun ? ` · ${new Date(result.nextRun).toLocaleString()}` : ""}`
                  : `Schedule saved${result.nextRun ? ` · next run ${new Date(result.nextRun).toLocaleString()}` : ""}`
                : "Schedule removed; workflow saved."
            )
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save schedule.")
          }
        })
      }}
    >
      <CalendarClock />
      Schedule
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState("toolbar")

  // TODO: read the currently selected node from React Flow.
  const selected = useStore((s) => s.nodes.find((n) => n.selected)) as
    StepNodeType | undefined

  // TODO: auto-switch to the Editor tab when the selection changes.
  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id)
  if (selected && selected.id !== prevSelectedId) {
    setPrevSelectedId(selected.id)
    setTab("editor")
  }

  return (
    <ResizablePanel
      className="bg-background"
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      groupResizeBehavior="preserve-pixel-size"
    >
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <div className="flex items-center gap-1.5">
            <ScheduleButton workflowId={workflowId} />
            <RunButton workflowId={workflowId} />
          </div>
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            <Bot className="mr-1 size-3.5" />
            AI
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector key={selected?.id} node={selected} />
        </TabsContent>
        <TabsContent value="ai" className="flex min-h-0 flex-col">
          <AiWorkflowBuilder />
        </TabsContent>
      </Tabs>
    </ResizablePanel>
  )
}
