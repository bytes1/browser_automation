"use client"

import { useState, useTransition } from "react"
import { useReactFlow, useStore, type Edge } from "@xyflow/react"
import { AudioLines, Bot, CalendarClock, CheckCircle2, Globe, Layers, LoaderCircle, MapPin, MoreHorizontal, Play, Radar, Sparkles, Trash2, Unlink } from "lucide-react"
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
import { useWorkflowFlow } from "@/features/workflows/components/workflow-flow-provider"
import { AiWorkflowBuilder } from "@/features/workflows/components/ai-workflow-builder"
import { useUpstreamConnections } from "@/features/workflows/hooks/use-upstream-connections"
import { WORKFLOW_TEMPLATES, type TemplateId } from "@/features/workflows/lib/templates"
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

// Live Qloo Entity Resolver inside the Inspector for qloo-search nodes
function QlooSeedVerifier({
  query,
  entityType,
}: {
  query?: string
  entityType?: string
}) {
  const [resolved, setResolved] = useState<
    Array<{ id: string; name: string; type: string }> | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, startVerify] = useTransition()

  const canVerify = Boolean(query?.trim() && !query.includes("{{"))

  const handleVerify = () => {
    if (!canVerify) return
    setError(null)
    startVerify(async () => {
      try {
        const res = await fetch("/api/qloo/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, entityType }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Could not verify Qloo entities.")
        }
        setResolved(data.entities ?? [])
      } catch (err) {
        setResolved(null)
        setError(
          err instanceof Error ? err.message : "Could not verify Qloo seeds."
        )
      }
    })
  }

  return (
    <div className="space-y-2 rounded-md border border-fuchsia-500/30 bg-fuchsia-500/5 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-fuchsia-600 dark:text-fuchsia-400">
          <Sparkles className="size-3" />
          Live Qloo Seed Lookup
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!canVerify || isVerifying}
          onClick={handleVerify}
          className="h-6 px-2 text-[10px]"
        >
          {isVerifying ? (
            <LoaderCircle className="size-3 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3" />
          )}
          Verify in Qloo
        </Button>
      </div>

      {!canVerify && (
        <p className="text-[10px] text-muted-foreground">
          {query?.includes("{{")
            ? "Dynamic upstream web data will be resolved automatically during workflow execution."
            : "Type artist, movie, brand, or venue names above to preview live Qloo entity IDs."}
        </p>
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      {resolved && resolved.length > 0 && (
        <div className="space-y-1 pt-1">
          {resolved.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center justify-between gap-2 rounded border border-border/70 bg-background px-2 py-1 text-[11px]"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">
                  {entity.name}
                </div>
                <div className="truncate font-mono text-[9px] text-muted-foreground">
                  ID: {entity.id.slice(0, 18)}…
                </div>
              </div>
              <span className="shrink-0 rounded bg-fuchsia-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-fuchsia-600 dark:text-fuchsia-300">
                {entity.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const KNOWN_CITIES = [
  "Tokyo",
  "New York",
  "London",
  "Paris",
  "Kyoto",
  "Seoul",
  "Berlin",
  "Los Angeles",
  "San Francisco",
  "Austin",
  "Chicago",
  "Toronto",
  "Barcelona",
  "Lisbon",
  "Amsterdam",
  "Singapore",
  "Melbourne",
  "Mumbai",
  "Bengaluru",
]

const KNOWN_VIBES = [
  "indie",
  "cozy",
  "vinyl",
  "speakeasy",
  "minimalist",
  "brutalist",
  "craft",
  "avant-garde",
  "late-night",
  "rooftop",
  "omakase",
  "third-wave coffee",
  "underground",
  "boutique",
  "quiet",
  "jazz",
]

function parseWisprVibeSentence(
  sentence: string,
  nodeType: NodeType,
  currentValues: Record<string, string>
): Record<string, string> {
  const next = { ...currentValues }
  const clean = sentence.trim()
  if (!clean) return next

  // 1. Detect negative / dislike clause ("avoid ...", "no ...", "without ...", "exclude ...")
  let mainClause = clean
  const negMatch = clean.match(
    /\b(?:avoid|excluding|exclude|without|no)\s+([^.;]+)$/i
  )
  if (negMatch?.[1]) {
    const negSeeds = negMatch[1].trim().replace(/\.$/, "")
    if (nodeType === "qloo-recommend") {
      next.negativeSeeds = negSeeds
    }
    mainClause = clean.slice(0, negMatch.index).trim()
  }

  // 2. Detect city
  for (const city of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${city}\\b`, "i")
    if (regex.test(mainClause)) {
      if (
        nodeType === "qloo-recommend" ||
        nodeType === "qloo-local" ||
        nodeType === "qloo-compare"
      ) {
        next.city = city
      }
      break
    }
  }

  // 3. Detect category URN
  const lower = mainClause.toLowerCase()
  const detectedCategory =
    /\b(brand|brands|fashion|apparel|label)\b/.test(lower)
      ? "urn:entity:brand"
      : /\b(book|books|author|novel|reading)\b/.test(lower)
        ? "urn:entity:book"
        : /\b(movie|movies|film|films|cinema)\b/.test(lower)
          ? "urn:entity:movie"
          : /\b(podcast|podcasts)\b/.test(lower)
            ? "urn:entity:podcast"
            : /\b(artist|artists|music|musician|band)\b/.test(lower)
              ? "urn:entity:artist"
              : /\b(place|places|venue|venues|bar|bars|cafe|coffee|restaurant|dining|spots)\b/.test(
                    lower
                  )
                ? "urn:entity:place"
                : null

  if (detectedCategory) {
    if (nodeType === "qloo-recommend" || nodeType === "qloo-compare") {
      next.targetType = detectedCategory
    } else if (nodeType === "qloo-search") {
      next.entityType = detectedCategory
    }
  }

  // 4. Detect mood / vibe tags
  const matchedVibes = KNOWN_VIBES.filter((vibe) =>
    lower.includes(vibe.toLowerCase())
  )
  if (
    matchedVibes.length > 0 &&
    (nodeType === "qloo-recommend" || nodeType === "qloo-local")
  ) {
    next.vibeTags = matchedVibes.join(", ")
  }

  // 5. Extract seed entities ("for fans of ...", "based on ...", "like ...", or quoted/capitalized phrases)
  const seedMatch = mainClause.match(
    /\b(?:fans of|based on|aligned with|who love|who likes?|like|seeds?:?)\s+([^.;]+)$/i
  )
  const rawSeedSegment = (seedMatch?.[1] ?? mainClause)
    .replace(/\b(?:in|at|around|near)\s+[A-Z][a-zA-Z\s]+$/, "")
    .replace(/\b(?:and|or)\b/gi, ",")
    .replace(/[.;]+$/, "")
    .trim()

  if (rawSeedSegment) {
    if (nodeType === "qloo-search") {
      next.query = rawSeedSegment
    } else if (
      (nodeType === "qloo-recommend" || nodeType === "qloo-local") &&
      !currentValues.entityIds?.includes("{{")
    ) {
      next.entityIds = rawSeedSegment
    } else if (nodeType === "qloo-compare") {
      const vsSplit = rawSeedSegment.split(/\b(?:vs\.?|versus|compared to|and)\b/i)
      if (vsSplit.length >= 2) {
        next.firstSeeds = vsSplit[0].trim()
        next.secondSeeds = vsSplit.slice(1).join(", ").trim()
      }
    }
  }

  return next
}

function WisprVibeDictation({
  nodeType,
  values,
  onApplyValues,
}: {
  nodeType: NodeType
  values: Record<string, string>
  onApplyValues: (nextValues: Record<string, string>) => void
}) {
  const [utterance, setUtterance] = useState("")

  const handleApply = (raw = utterance) => {
    if (!raw.trim()) return
    const next = parseWisprVibeSentence(raw, nodeType, values)
    onApplyValues(next)
    setUtterance("")
    toast.success("Parsed Wispr Flow dictation into node fields!")
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-300">
          <AudioLines className="size-3.5" />
          Dictate Vibe with Wispr Flow
        </span>
        <span className="text-[9px] text-muted-foreground">
          Auto-fills fields
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          value={utterance}
          onChange={(e) => {
            const val = e.target.value
            const delta = val.length - utterance.length
            setUtterance(val)
            // Auto-parse when Wispr Flow Desktop injects a full sentence burst
            if (delta >= 16 && val.trim().length >= 16) {
              handleApply(val)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleApply()
            }
          }}
          placeholder="Speak e.g. 'Cozy vinyl bars in Tokyo for fans of Radiohead, avoid tourist traps'"
          className="h-7 text-[11px]"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!utterance.trim()}
          onClick={() => handleApply()}
          className="h-7 shrink-0 px-2 text-[10px]"
        >
          Fill
        </Button>
      </div>
    </div>
  )
}

function replaceSpokenTokens(
  input: string,
  connections: Array<{ token: string; label: string }>
): string {
  if (connections.length === 0) return input
  let result = input

  const spokenPatterns: Array<{ regex: RegExp; pathSuffix: string }> = [
    { regex: /\b(?:insert|pipe)\s+entity\s+ids?\b/gi, pathSuffix: ".entityIds }}" },
    { regex: /\b(?:insert|pipe)\s+top\s+pick\s+name\b/gi, pathSuffix: ".topPickName }}" },
    { regex: /\b(?:insert|pipe)\s+top\s+pick\s+reason\b/gi, pathSuffix: ".topPickReason }}" },
    { regex: /\b(?:insert|pipe)\s+extracted\s+data\b/gi, pathSuffix: ".data }}" },
    { regex: /\b(?:insert|pipe)\s+search\s+query\b/gi, pathSuffix: ".searchQuery }}" },
    { regex: /\b(?:insert|pipe)\s+summary\b/gi, pathSuffix: ".summary }}" },
  ]

  for (const { regex, pathSuffix } of spokenPatterns) {
    if (regex.test(result)) {
      const matchConn = connections.find((c) => c.token.endsWith(pathSuffix))
      if (matchConn) {
        result = result.replace(regex, matchConn.token)
      }
    }
  }
  return result
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
        {(type === "qloo-search" ||
          type === "qloo-recommend" ||
          type === "qloo-local" ||
          type === "qloo-compare") && (
          <WisprVibeDictation
            nodeType={type}
            values={values}
            onApplyValues={(nextValues) =>
              updateNodeData(node.id, { values: nextValues })
            }
          />
        )}

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
                onChange={(rawValue) => {
                  const value = replaceSpokenTokens(rawValue, connections)
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

        {type === "qloo-search" && (
          <QlooSeedVerifier
            query={values.query}
            entityType={values.entityType}
          />
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
  const { onNodesChange, onEdgesChange, onDelete } = useWorkflowFlow()
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

  const loadTemplate = (templateType: TemplateId) => {
    const template = WORKFLOW_TEMPLATES[templateType]
    if (!template) return

    const { x, y, zoom } = getViewport()
    const safeZoom = zoom || 1
    const center = {
      x: width ? (width / 2 - x) / safeZoom : 0,
      y: height ? (height / 2 - y) / safeZoom : 0,
    }

    const { nodes: newNodes, edges: newEdges } = template.buildGraph(
      center,
      crypto.randomUUID()
    )

    replaceGraph(newNodes, newEdges)
    window.setTimeout(() => {
      void fitView({ padding: 0.16, duration: 300 })
    }, 80)
    toast.success(`Loaded "${template.name}" blueprint!`)
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-b border-border/80 bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-fuchsia-500" />
            <span>Starter Blueprints</span>
          </div>
          <span className="rounded-full bg-fuchsia-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-600 dark:text-fuchsia-400">
            1-Click
          </span>
        </div>
        <div className="grid gap-1.5">
          <button
            type="button"
            onClick={() => loadTemplate("cultural-positioning")}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-violet-500/35 bg-gradient-to-r from-violet-500/12 via-fuchsia-500/8 to-transparent px-2.5 py-2 text-left text-xs font-medium text-foreground transition-all hover:border-violet-500/60 hover:from-violet-500/20 hover:shadow-2xs"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-500/20 text-violet-600 dark:text-violet-300">
              <Radar className="size-3.5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">
                Subculture &amp; Competitor Positioning
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                Your URL → 3 Qloo Personas → Competitor Scrape
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => loadTemplate("web-to-taste")}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-emerald-500/25 bg-gradient-to-r from-emerald-500/8 via-teal-500/5 to-transparent px-2.5 py-2 text-left text-xs font-medium text-foreground transition-all hover:border-emerald-500/50 hover:from-emerald-500/15 hover:shadow-2xs"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Globe className="size-3.5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">Web-to-Taste Auto-Discovery</span>
              <span className="truncate text-[10px] text-muted-foreground">
                Stagehand + Qloo + Gemini Pitch
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => loadTemplate("concierge")}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-all hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400">
              <Sparkles className="size-3.5" />
            </span>
            <span className="truncate">Autonomous Cultural Concierge</span>
          </button>

          <button
            type="button"
            onClick={() => loadTemplate("cross-domain")}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-all hover:border-violet-500/40 hover:bg-violet-500/5"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-500/12 text-violet-600 dark:text-violet-400">
              <Layers className="size-3.5" />
            </span>
            <span className="truncate">Cross-Domain Taste Scout</span>
          </button>

          <button
            type="button"
            onClick={() => loadTemplate("local")}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-all hover:border-rose-500/40 hover:bg-rose-500/5"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-rose-500/12 text-rose-600 dark:text-rose-400">
              <MapPin className="size-3.5" />
            </span>
            <span className="truncate">Local Places Explorer</span>
          </button>
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["trigger", "browser-ai", "qloo"]}
        className="px-3 py-2"
      >
        {[
          {
            key: "trigger",
            label: "Triggers",
            filter: (def: NodeDefinition) => def.kind === "trigger",
          },
          {
            key: "browser-ai",
            label: "Browser & AI Actions",
            filter: (def: NodeDefinition) =>
              def.kind === "action" && !def.type.startsWith("qloo"),
          },
          {
            key: "qloo",
            label: "Qloo Cultural Intelligence",
            filter: (def: NodeDefinition) => def.type.startsWith("qloo"),
          },
        ].map((group) => (
          <AccordionItem
            key={group.key}
            value={group.key}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              {group.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1 pb-2">
              {definitions.filter(group.filter).map((def) => (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => add(def.type as NodeType)}
                  className="group flex w-full items-center justify-between gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs font-medium text-foreground transition-all hover:border-border/80 hover:bg-accent/70"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <NodeIcon type={def.type as NodeType} />
                    <span className="truncate">{def.label}</span>
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    + Add
                  </span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
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
      disabled={isPending}
      className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-md dark:from-violet-500 dark:to-indigo-500"
      onClick={() => {
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
      {isPending ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : (
        <Play className="size-3.5 fill-current" />
      )}
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

  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id)
  if (selected && selected.id !== prevSelectedId) {
    setPrevSelectedId(selected.id)
    if (tab !== "ai") {
      setTab("editor")
    }
  }

  return (
    <div className="flex size-full flex-col bg-background">
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border/80 bg-card/60 px-2.5 py-2 backdrop-blur-xs">
          <ActionsMenu workflowId={workflowId} />
          <div className="flex items-center gap-1.5">
            <ScheduleButton workflowId={workflowId} />
            <RunButton workflowId={workflowId} />
          </div>
        </div>
        <div className="border-b border-border/60 bg-muted/15 px-2.5 py-2">
          <TabsList className="grid w-full grid-cols-3 rounded-lg bg-muted/80 p-1">
            <TabsTrigger
              value="toolbar"
              className="rounded-md text-xs font-medium data-active:bg-background! data-active:text-foreground! data-active:shadow-2xs!"
            >
              Toolbar
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="rounded-md text-xs font-medium data-active:bg-background! data-active:text-foreground! data-active:shadow-2xs!"
            >
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="rounded-md text-xs font-medium data-active:bg-background! data-active:text-foreground! data-active:shadow-2xs!"
            >
              <Bot className="mr-1 size-3.5 text-violet-500" />
              AI
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="toolbar" className="flex min-h-0 flex-1 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-1 flex-col">
          <Inspector key={selected?.id} node={selected} />
        </TabsContent>
        <TabsContent value="ai" className="flex min-h-0 flex-1 flex-col">
          <AiWorkflowBuilder />
        </TabsContent>
      </Tabs>
    </div>
  )
}
