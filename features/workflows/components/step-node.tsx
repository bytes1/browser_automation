import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"

import {
    nodeRegistry,
    type NodeField,
    type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import { useLatestRunSteps } from "@/features/workflows/components/workflow-runs-provider"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { CheckCircle2, CircleAlert, Clock3, Globe, Sparkles } from "lucide-react"

const BROWSER_STEP_TYPES = new Set(["open-url", "act", "extract", "observe"])

function getCategoryMeta(type: string, kind: string): {
    badge: string
    barClass: string
} {
    if (kind === "trigger") {
        return {
            badge: "Trigger",
            barClass: "from-blue-500 via-indigo-500 to-violet-500",
        }
    }
    if (type.startsWith("qloo")) {
        return {
            badge: "Qloo Taste AI",
            barClass: "from-fuchsia-500 via-purple-500 to-pink-500",
        }
    }
    if (type === "ai-synthesize") {
        return {
            badge: "Gemini Synthesizer",
            barClass: "from-indigo-500 via-violet-500 to-purple-500",
        }
    }
    if (BROWSER_STEP_TYPES.has(type)) {
        return {
            badge: "Cloud Browser",
            barClass: "from-emerald-500 via-teal-500 to-cyan-500",
        }
    }
    return {
        badge: "Action",
        barClass: "from-rose-500 via-pink-500 to-orange-500",
    }
}

function getStepOutputSummary(type: string, output: any): string | null {
    if (!output || typeof output !== "object") return null

    if (type.startsWith("qloo")) {
        if (output.compatibilityScore) {
            return `Overlap: ${output.compatibilityScore}${output.topPickName ? ` · ${output.topPickName}` : ""}`
        }
        if (output.topAgeGroup) {
            return `Cohort: ${output.topAgeGroup} (${output.topGender ?? "balanced"})`
        }
        if (output.topPickName) {
            return `⭐ ${output.topPickName}`
        }
    }

    if (type === "ai-synthesize" && output.headline) {
        return `✨ ${output.headline}`
    }

    if (type === "extract" && output.result) {
        if (typeof output.result === "string") return output.result.slice(0, 60)
        if (typeof output.result === "object") {
            const firstVal = Object.values(output.result)[0]
            if (typeof firstVal === "string") return firstVal.slice(0, 60)
        }
    }

    return null
}

function StepNodeComponent({ id, data, selected }: NodeProps<StepNodeType>) {
    const { type, kind, title, values } = data
    const def = nodeRegistry[type]
    const Icon = def.icon
    const fields = (def.fields as NodeField[]).filter((field) => {
        if (!values[field.key]) return false
        if (!field.showWhen) return true
        const selectedValue =
            values[field.showWhen.field] ??
            (field.showWhen.field === "frequency" && values.cron ? "custom" : "")
        return selectedValue === field.showWhen.value
    })

    // Reflect this node's state in the latest run. A node is only "running" while
    // the run is actually live — once it ends, a node left marked running stops
    // spinning rather than hanging forever.
    const { steps, isLive, browserSession } = useLatestRunSteps()
    const step = steps.find((s) => s.nodeId === id)
    const status = step?.status
    const isRunning = status === "running" && isLive
    const isFailed = status === "failed"
    const statusLabel = isRunning
        ? "Running"
        : status === "done"
          ? "Done"
          : status === "failed"
            ? "Failed"
            : status === "pending"
              ? "Pending"
              : undefined

    const isBrowserStep = BROWSER_STEP_TYPES.has(type)
    const outputSummary = status === "done" ? getStepOutputSummary(type, step?.output) : null
    const categoryMeta = getCategoryMeta(type, kind)

    // A trigger starts the flow and takes no input, so it has no target handle.
    const hasTarget = kind !== "trigger"

    return (
        <div
            className={cn(
                "group relative min-w-56 max-w-80 rounded-xl border bg-card/95 text-card-foreground shadow-sm backdrop-blur-xs transition-all duration-200 hover:shadow-md",
                !status && "border-border/90 hover:border-foreground/25",
                isRunning && "border-blue-500/80 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/20",
                status === "done" && "border-emerald-500/60 shadow-sm shadow-emerald-500/5",
                isFailed && "border-destructive/80 shadow-sm shadow-destructive/10",
                selected && "ring-2 ring-violet-500 ring-offset-2 ring-offset-background shadow-md"
            )}
        >
            {/* Subtle category / status top accent bar */}
            <div
                className={cn(
                    "h-1 w-full rounded-t-xl bg-gradient-to-r opacity-85",
                    isRunning
                        ? "from-blue-500 via-cyan-400 to-indigo-500 animate-pulse"
                        : status === "done"
                          ? "from-emerald-500 via-teal-400 to-emerald-600"
                          : isFailed
                            ? "from-rose-500 via-red-500 to-orange-500"
                            : categoryMeta.barClass
                )}
            />

            {hasTarget && (
                <Handle
                    type="target"
                    position={Position.Left}
                    style={{ transform: "translate(-50%, -50%)" }}
                    className="size-3! min-w-0! rounded-full! border-2! border-background! bg-muted-foreground/55! shadow-2xs transition-transform group-hover:scale-110 group-hover:bg-violet-500!"
                />
            )}

            <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <div
                    className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg shadow-2xs",
                        def.accent
                    )}
                >
                    {isRunning ? <Spinner className="size-4" /> : <Icon className="size-4" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
                        {title}
                    </span>
                    <span className="truncate text-[10px] font-medium text-muted-foreground">
                        {categoryMeta.badge}
                    </span>
                </div>
                {statusLabel && (
                    <span
                        className={cn(
                            "ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            isRunning &&
                                "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
                            status === "done" &&
                                "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                            isFailed &&
                                "border-destructive/30 bg-destructive/10 text-destructive",
                            status === "pending" &&
                                "border-border bg-muted text-muted-foreground"
                        )}
                        aria-label={`Step status: ${statusLabel}`}
                    >
                        {isRunning ? (
                            <Spinner className="size-2.5" />
                        ) : status === "done" ? (
                            <CheckCircle2 className="size-2.5" />
                        ) : isFailed ? (
                            <CircleAlert className="size-2.5" />
                        ) : (
                            <Clock3 className="size-2.5" />
                        )}
                        {statusLabel}
                    </span>
                )}
            </div>

            {fields.length > 0 && (
                <>
                    <div className="border-t border-border/70" />
                    <div className="flex flex-col gap-1.5 bg-muted/20 px-3.5 py-2.5">
                        {fields.map((field) => (
                            <div
                                key={field.key}
                                className="flex items-center justify-between gap-3 text-xs"
                            >
                                <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                                    {field.label}
                                </span>
                                <span className="max-w-44 truncate rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                                    {values[field.key]}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {isRunning && isBrowserStep && browserSession && (
                <div className="flex items-center justify-between gap-2 rounded-b-xl border-t border-blue-500/20 bg-blue-500/8 px-3.5 py-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1.5 truncate">
                        <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
                        <Globe className="size-3 shrink-0" />
                        <span className="truncate">Cloud Browser Session Active</span>
                    </span>
                    <span className="font-mono text-[9px] opacity-80">
                        {browserSession.sessionId.slice(0, 6)}
                    </span>
                </div>
            )}

            {outputSummary && (
                <div className="flex items-center justify-between gap-2 rounded-b-xl border-t border-emerald-500/20 bg-emerald-500/8 px-3.5 py-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5 truncate">
                        <Sparkles className="size-3 shrink-0 text-emerald-500" />
                        <span className="truncate">{outputSummary}</span>
                    </span>
                    {step?.durationMs !== undefined && (
                        <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                            {step.durationMs < 1000
                                ? `${step.durationMs}ms`
                                : `${(step.durationMs / 1000).toFixed(1)}s`}
                        </span>
                    )}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                style={{ transform: "translate(50%, -50%)" }}
                className="size-3! min-w-0! rounded-full! border-2! border-background! bg-muted-foreground/55! shadow-2xs transition-transform group-hover:scale-110 group-hover:bg-emerald-500!"
            />
        </div>
    )
}

export const StepNode = memo(StepNodeComponent)
