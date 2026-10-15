"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
    Activity,
    Check,
    CheckCircle2,
    CircleAlert,
    Clock3,
    Copy,
    Layers,
    Play,
    Sparkles,
    Terminal,
    Timer,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import {
    nodeRegistry,
    type NodeType,
} from "@/features/workflows/nodes/node-registry"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import {
    getRunSteps,
    useWorkflowRuns,
    type WorkflowRun,
} from "@/features/workflows/components/workflow-runs-provider"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms?: number): string {
    if (ms === undefined || ms === null) return "—"
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    const mins = Math.floor(ms / 60000)
    const secs = ((ms % 60000) / 1000).toFixed(1)
    return `${mins}m ${secs}s`
}

function formatRelativeTime(date?: Date | string): string {
    if (!date) return "—"
    try {
        return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
        return String(date)
    }
}

function CopyButton({
    text,
    label = "Copy",
    className,
}: {
    text: string
    label?: string
    className?: string
}) {
    const [copied, setCopied] = useState(false)

    const handleCopy = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            if (!navigator?.clipboard) return
            navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success("Copied to clipboard")
            setTimeout(() => setCopied(false), 2000)
        },
        [text]
    )

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                className
            )}
            title={label}
        >
            {copied ? (
                <>
                    <Check className="size-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                </>
            ) : (
                <>
                    <Copy className="size-3" />
                    <span>{label}</span>
                </>
            )}
        </button>
    )
}

function StepIconChip({
    nodeType,
    className,
}: {
    nodeType?: string
    className?: string
}) {
    const def = nodeType ? nodeRegistry[nodeType as NodeType] : undefined
    const Icon = def?.icon ?? Activity
    const accent = def?.accent ?? "bg-muted text-muted-foreground"

    return (
        <span
            className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-sm text-white",
                accent,
                className
            )}
        >
            <Icon className="size-3" />
        </span>
    )
}

function RunStatusBadge({ status }: { status: WorkflowRun["status"] }) {
    if (status === "EXECUTING") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <Spinner className="size-3" />
                Running
            </span>
        )
    }

    if (status === "QUEUED") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <Clock3 className="size-3" />
                Queued
            </span>
        )
    }

    if (status === "COMPLETED") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Success
            </span>
        )
    }

    if (
        status === "FAILED" ||
        status === "SYSTEM_FAILURE" ||
        status === "CRASHED" ||
        status === "TIMED_OUT"
    ) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <CircleAlert className="size-3" />
                Failed
            </span>
        )
    }

    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {status.toLowerCase()}
        </span>
    )
}

function StepStatusBadge({
    status,
    isLive,
}: {
    status: RunStep["status"]
    isLive?: boolean
}) {
    if (status === "running" && isLive) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                <Spinner className="size-2.5" />
                Running
            </span>
        )
    }

    if (status === "done") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-2.5" />
                Done
            </span>
        )
    }

    if (status === "failed") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                <CircleAlert className="size-2.5" />
                Failed
            </span>
        )
    }

    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Clock3 className="size-2.5" />
            Pending
        </span>
    )
}

function FormattedJson({ data }: { data: unknown }) {
    const jsonString = useMemo(() => {
        try {
            return JSON.stringify(data, null, 2)
        } catch {
            return String(data)
        }
    }, [data])

    return (
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground select-text">
            {jsonString}
        </pre>
    )
}

type QlooOutputData = {
    entities?: Array<{
        id: string
        name: string
        type: string
        affinity: number | null
        explanation?: string
    }>
    names?: string[]
    topPickName?: string
    topPickReason?: string
    summary?: string
    searchQuery?: string
    city?: string | null
    query?: string
    compatibilityScore?: string
    topAgeGroup?: string
    topGender?: string
    ageBreakdown?: Record<string, number>
    genderBreakdown?: Record<string, number>
    personaSummary?: string
}

type SynthesisOutputData = {
    headline?: string
    keyTakeaways?: string[]
    content?: string
    actionRecommendation?: string
    summary?: string
}

function SynthesisResultCard({ output }: { output: SynthesisOutputData }) {
    const [viewMode, setViewMode] = useState<"visual" | "json">("visual")
    const { headline, keyTakeaways, content, actionRecommendation } = output

    if (viewMode === "json") {
        return (
            <div className="space-y-2">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setViewMode("visual")}
                        className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        ← Switch to Executive Brief
                    </button>
                </div>
                <FormattedJson data={output} />
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="size-3.5" />
                    <span>AI Cultural &amp; Web Intelligence Brief</span>
                </div>
                <button
                    type="button"
                    onClick={() => setViewMode("json")}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                    View Raw JSON
                </button>
            </div>

            <div className="space-y-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3.5">
                {headline && (
                    <div className="text-sm font-bold text-foreground">
                        {headline}
                    </div>
                )}

                {Array.isArray(keyTakeaways) && keyTakeaways.length > 0 && (
                    <div className="space-y-1 rounded-md border border-border/60 bg-background/80 p-2.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Key Cultural &amp; Web Takeaways
                        </div>
                        <ul className="space-y-1 text-xs text-foreground">
                            {keyTakeaways.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-indigo-500">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {content && (
                    <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                        {content}
                    </div>
                )}

                {actionRecommendation && (
                    <div className="flex items-center justify-between gap-2 rounded bg-indigo-500/10 px-2.5 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        <span>Recommended Action: {actionRecommendation}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function QlooTasteCard({ output }: { output: QlooOutputData }) {
    const [viewMode, setViewMode] = useState<"visual" | "json">("visual")
    const {
        topPickName,
        topPickReason,
        entities,
        searchQuery,
        summary,
        city,
        compatibilityScore,
        topAgeGroup,
        topGender,
        ageBreakdown,
        personaSummary,
    } = output

    if (viewMode === "json") {
        return (
            <div className="space-y-2">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setViewMode("visual")}
                        className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 hover:underline font-medium"
                    >
                        ← Switch to Taste Visualizer
                    </button>
                </div>
                <FormattedJson data={output} />
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                    <Sparkles className="size-3.5" />
                    <span>Qloo Taste Intelligence Insights</span>
                </div>
                <button
                    type="button"
                    onClick={() => setViewMode("json")}
                    className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                >
                    View Raw JSON
                </button>
            </div>

            {compatibilityScore && (
                <div className="flex items-center justify-between rounded-lg border border-pink-500/30 bg-pink-500/10 px-3.5 py-2.5">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-300">
                            Taste Overlap Score
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Cross-profile cultural bridge compatibility
                        </div>
                    </div>
                    <span className="font-mono text-lg font-bold text-pink-600 dark:text-pink-300">
                        {compatibilityScore}
                    </span>
                </div>
            )}

            {ageBreakdown && (
                <div className="space-y-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3.5">
                    <div className="flex items-center justify-between">
                        <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                            👥 Audience Persona Cohort
                        </span>
                        {topAgeGroup && (
                            <span className="font-mono text-xs font-semibold text-purple-700 dark:text-purple-300">
                                {topAgeGroup} · {topGender}
                            </span>
                        )}
                    </div>
                    {personaSummary && (
                        <p className="text-xs text-muted-foreground">
                            {personaSummary}
                        </p>
                    )}
                    <div className="space-y-1.5 pt-1">
                        {Object.entries(ageBreakdown).map(([cohort, ratio]) => {
                            const pct = Math.min(100, Math.max(4, Math.round(ratio * 100)))
                            return (
                                <div key={cohort} className="space-y-0.5">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="capitalize text-muted-foreground">
                                            {cohort.replaceAll("_", " ")}
                                        </span>
                                        <span className="font-mono font-medium text-foreground">
                                            {pct}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/70">
                                        <div
                                            className="h-full rounded-full bg-purple-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {topPickName && (
                <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
                            ⭐ Top Cultural Match {city ? `in ${city}` : ""}
                        </span>
                        {entities?.[0]?.affinity !== null && entities?.[0]?.affinity !== undefined && (
                            <span className="font-mono text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300">
                                {Math.round(entities[0].affinity * 100)}% Affinity
                            </span>
                        )}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                        {topPickName}
                    </div>
                    {topPickReason && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {topPickReason}
                        </p>
                    )}
                    {searchQuery && (
                        <div className="rounded bg-background/70 p-2 text-[11px] font-mono text-muted-foreground flex items-center justify-between gap-2 border border-border/50">
                            <span className="truncate">Browser Query: {searchQuery}</span>
                            <CopyButton text={searchQuery} label="Copy Query" />
                        </div>
                    )}
                </div>
            )}

            {Array.isArray(entities) && entities.length > 0 && (
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Matched Cultural Entities ({entities.length})
                    </div>
                    <div className="divide-y divide-border/60">
                        {entities.slice(0, 6).map((entity, i) => {
                            const pct =
                                entity.affinity !== null && entity.affinity !== undefined
                                    ? Math.min(100, Math.max(10, Math.round(entity.affinity * 100)))
                                    : null
                            const cleanType = entity.type
                                ?.replace("urn:entity:", "")
                                .replaceAll("_", " ")

                            return (
                                <div key={entity.id || i} className="py-2 first:pt-0 last:pb-0 space-y-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-foreground truncate">
                                                {i + 1}. {entity.name}
                                            </span>
                                            {cleanType && cleanType !== "unknown" && (
                                                <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] uppercase text-muted-foreground">
                                                    {cleanType}
                                                </span>
                                            )}
                                        </div>
                                        {pct !== null && (
                                            <span className="shrink-0 rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                                                {pct}%
                                            </span>
                                        )}
                                    </div>
                                    {entity.explanation && (
                                        <div className="text-[11px] text-muted-foreground truncate">
                                            {entity.explanation}
                                        </div>
                                    )}
                                    {pct !== null && (
                                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {summary && (!entities || entities.length === 0) && !ageBreakdown && (
                <div className="rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-foreground whitespace-pre-wrap">
                    {summary}
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Step Details Panel
// ---------------------------------------------------------------------------

function StepDetailsPanel({
    step,
    isLive,
    runError,
}: {
    step?: RunStep
    isLive: boolean
    runError?: { message?: string }
}) {
    if (!step) {
        return (
            <div className="flex size-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Layers className="size-8 stroke-[1.5] text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">No step selected</p>
                <p className="text-xs text-muted-foreground">
                    Select a step from the list on the left to inspect its output and error.
                </p>
            </div>
        )
    }

    const { title, nodeType, status, durationMs, output, error, nodeId } = step
    const hasOutput = output !== undefined && output !== null
    const hasError = !!error || status === "failed"
    const isQlooStep =
        nodeType?.startsWith("qloo") ||
        (typeof output === "object" &&
            output !== null &&
            ("entities" in output ||
                "topPickName" in output ||
                "ageBreakdown" in output))
    const isSynthesisStep =
        nodeType === "ai-synthesize" ||
        (typeof output === "object" &&
            output !== null &&
            "headline" in output &&
            "keyTakeaways" in output)

    return (
        <div className="flex size-full flex-col overflow-y-auto">
            {/* Step Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/60 px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                    <StepIconChip nodeType={nodeType} className="size-6" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-foreground">
                                {title || `Node ${nodeId}`}
                            </h3>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {nodeType}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 rounded bg-muted/70 px-2 py-0.5 text-xs text-muted-foreground">
                        <Timer className="size-3" />
                        <span className="font-mono font-medium text-foreground">
                            {formatDuration(durationMs)}
                        </span>
                    </div>
                    <StepStatusBadge status={status} isLive={isLive} />
                </div>
            </div>

            {/* Step Body */}
            <div className="flex-1 space-y-4 p-4 min-w-0">
                {/* Error Box if Failed */}
                {hasError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-destructive">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <CircleAlert className="size-4" />
                                <span>Execution Error</span>
                            </div>
                            {error && <CopyButton text={error} label="Copy Error" />}
                        </div>
                        <pre className="whitespace-pre-wrap break-words rounded bg-destructive/10 p-2 font-mono text-xs leading-relaxed select-text">
                            {error || runError?.message || "Step failed without an explicit error message."}
                        </pre>
                    </div>
                )}

                {/* Output Box */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Produced Output
                        </span>
                        {hasOutput && (
                            <CopyButton
                                text={
                                    typeof output === "object"
                                        ? JSON.stringify(output, null, 2)
                                        : String(output)
                                }
                                label="Copy Output"
                            />
                        )}
                    </div>

                    {hasOutput ? (
                        isQlooStep ? (
                            <QlooTasteCard output={output as QlooOutputData} />
                        ) : isSynthesisStep ? (
                            <SynthesisResultCard output={output as SynthesisOutputData} />
                        ) : (
                            <FormattedJson data={output} />
                        )
                    ) : (
                        <div className="rounded-md border border-dashed border-border/80 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                            {status === "running" && isLive ? (
                                <div className="flex items-center justify-center gap-2 text-blue-500">
                                    <Spinner className="size-3.5" />
                                    <span>Step is executing in realtime...</span>
                                </div>
                            ) : status === "pending" ? (
                                <span>This step is pending execution.</span>
                            ) : status === "failed" ? (
                                <span>No output was produced because this step failed.</span>
                            ) : (
                                <span>This step completed with no output.</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Node Metadata Footer */}
                <div className="border-t border-border pt-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span>
                            Node ID: <code className="font-mono text-foreground">{nodeId}</code>
                        </span>
                        {durationMs !== undefined && (
                            <span>
                                Execution time:{" "}
                                <code className="font-mono text-foreground">{durationMs}ms</code>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main WorkflowConsole Component
// ---------------------------------------------------------------------------

export function WorkflowConsole({ workflowId }: { workflowId: string }) {
    const { runs, activeRun } = useWorkflowRuns()
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)

    // Automatically follow along with live active runs
    useEffect(() => {
        if (activeRun?.id) {
            setSelectedRunId(activeRun.id)
        }
    }, [activeRun?.id])

    // Find the currently selected run, defaulting to the latest run
    const selectedRun = useMemo<WorkflowRun | undefined>(() => {
        if (!runs || runs.length === 0) return undefined
        if (selectedRunId) {
            const found = runs.find((r) => r.id === selectedRunId)
            if (found) return found
        }
        return runs[0]
    }, [runs, selectedRunId])

    const steps = useMemo(() => {
        if (!selectedRun) return []
        return getRunSteps(selectedRun)
    }, [selectedRun])

    const isLive = selectedRun?.status === "EXECUTING" || selectedRun?.status === "QUEUED"

    // When run changes, auto-select the most relevant step (failed, running, or first)
    const effectiveStepIndex = useMemo(() => {
        if (steps.length === 0) return -1
        if (
            selectedStepIndex !== null &&
            selectedStepIndex >= 0 &&
            selectedStepIndex < steps.length
        ) {
            return selectedStepIndex
        }

        const failedIdx = steps.findIndex((s) => s.status === "failed")
        if (failedIdx !== -1) return failedIdx

        const runningIdx = steps.findIndex((s) => s.status === "running")
        if (runningIdx !== -1) return runningIdx

        return 0
    }, [steps, selectedStepIndex])

    const selectedStep = steps[effectiveStepIndex]

    if (runs.length === 0) {
        return (
            <div className="flex size-full flex-col bg-background">
                <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-card px-3 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <Terminal className="size-3.5 text-muted-foreground" />
                        <span>Console</span>
                    </div>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40 mb-2">
                        <Play className="size-4 text-muted-foreground/70" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No workflow runs yet</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Trigger a run from the toolbar above to see real-time execution steps,
                        outputs, errors, and timing details.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex size-full flex-col bg-background">
            {/* Console Header Bar */}
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-card px-3 text-xs font-semibold">
                <div className="flex items-center gap-2">
                    <Terminal className="size-3.5 text-primary" />
                    <span>Console</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {runs.length} {runs.length === 1 ? "run" : "runs"}
                    </span>
                    {runs.some((r) => r.status === "EXECUTING") && (
                        <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                            <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
                            Live
                        </span>
                    )}
                </div>

                {selectedRun && (
                    <div className="flex items-center gap-3 text-muted-foreground text-xs font-normal">
                        <span>
                            Run ID: <code className="font-mono text-foreground">{selectedRun.id.slice(0, 12)}...</code>
                        </span>
                        <span>
                            Total:{" "}
                            <span className="font-mono font-medium text-foreground">
                                {formatDuration(selectedRun.durationMs)}
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {/* Console 3-Column Split */}
            <div className="flex min-h-0 flex-1 divide-x divide-border">
                {/* Column 1: Runs List */}
                <div className="flex w-60 shrink-0 flex-col min-h-0 bg-muted/15">
                    <div className="flex h-8 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>Runs</span>
                        <span>{runs.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                        {runs.map((run, idx) => {
                            const isSelected = selectedRun?.id === run.id
                            const runSteps = getRunSteps(run)
                            const runNum = runs.length - idx

                            return (
                                <button
                                    key={run.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedRunId(run.id)
                                        setSelectedStepIndex(null)
                                    }}
                                    className={cn(
                                        "flex w-full flex-col gap-1 p-2.5 text-left text-xs transition-colors hover:bg-accent/50",
                                        isSelected && "bg-accent/80 shadow-xs ring-1 ring-border"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                            <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                                #{runNum}
                                            </span>
                                            <span className="truncate">{run.id.slice(0, 8)}</span>
                                        </div>
                                        <RunStatusBadge status={run.status} />
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>{formatRelativeTime(run.createdAt)}</span>
                                        <div className="flex items-center gap-2 font-mono">
                                            <span>{runSteps.length} steps</span>
                                            <span>·</span>
                                            <span>{formatDuration(run.durationMs)}</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Column 2: Steps List of Selected Run */}
                <div className="flex w-72 shrink-0 flex-col min-h-0 bg-background">
                    <div className="flex h-8 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>Steps</span>
                        <span>{steps.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                        {steps.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                {selectedRun?.status === "EXECUTING"
                                    ? "Initializing steps..."
                                    : "No steps recorded for this run."}
                            </div>
                        ) : (
                            steps.map((step, idx) => {
                                const isSelected = idx === effectiveStepIndex
                                const stepNum = idx + 1

                                return (
                                    <button
                                        key={step.nodeId || idx}
                                        type="button"
                                        onClick={() => setSelectedStepIndex(idx)}
                                        className={cn(
                                            "flex w-full items-center gap-2.5 p-2.5 text-left text-xs transition-colors hover:bg-accent/50",
                                            isSelected && "bg-accent/80 font-medium ring-1 ring-border"
                                        )}
                                    >
                                        <span className="font-mono text-[11px] text-muted-foreground/80 w-3.5 text-right shrink-0">
                                            {stepNum}
                                        </span>

                                        <StepIconChip nodeType={step.nodeType} />

                                        <div className="flex flex-1 flex-col truncate min-w-0">
                                            <span className="truncate text-foreground font-medium">
                                                {step.title || `Step ${stepNum}`}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono truncate">
                                                {step.nodeType}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {step.durationMs !== undefined && (
                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                    {formatDuration(step.durationMs)}
                                                </span>
                                            )}
                                            <StepStatusBadge
                                                status={step.status}
                                                isLive={isLive}
                                            />
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Column 3: Step Detail Inspector */}
                <div className="flex flex-1 flex-col min-h-0 bg-card/40">
                    <StepDetailsPanel
                        step={selectedStep}
                        isLive={isLive}
                        runError={selectedRun?.error}
                    />
                </div>
            </div>
        </div>
    )
}
