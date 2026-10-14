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
import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react"

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
    const { steps, isLive } = useLatestRunSteps()
    const status = steps.find((step) => step.nodeId === id)?.status
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

    // A trigger starts the flow and takes no input, so it has no target handle.
    const hasTarget = kind !== "trigger"

    return (
        <div
            className={cn(
                "min-w-50 max-w-80 rounded-(--radius) border-2 border-border bg-card text-card-foreground",
                isRunning && "border-blue-500",
                status === "done" && "border-emerald-500",
                isFailed && "border-destructive",
                selected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
            )}
        >
            {hasTarget && (
                <Handle
                    type="target"
                    position={Position.Left}
                    style={{ transform: "translate(-100%, -50%)" }}
                    className="h-3.5! w-1.5! min-w-0! rounded-l-xs! rounded-r-none! border-0! bg-border!"
                />
            )}

            <div className="flex items-center gap-2.5 px-3 py-2.5">
                <div
                    className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        def.accent
                    )}
                >
                    {isRunning ? <Spinner className="size-4" /> : <Icon className="size-4" />}
                </div>
                <span className="text-sm font-semibold">{title}</span>
                {statusLabel && (
                    <span
                        className={cn(
                            "ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            isRunning && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                            status === "done" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                            isFailed && "bg-destructive/10 text-destructive",
                            status === "pending" && "bg-muted text-muted-foreground"
                        )}
                        aria-label={`Step status: ${statusLabel}`}
                    >
                        {isRunning ? (
                            <Spinner className="size-3" />
                        ) : status === "done" ? (
                            <CheckCircle2 className="size-3" />
                        ) : isFailed ? (
                            <CircleAlert className="size-3" />
                        ) : (
                            <Clock3 className="size-3" />
                        )}
                        {statusLabel}
                    </span>
                )}
            </div>

            {fields.length > 0 && (
                <>
                    <div className="border-t border-border" />
                    <div className="flex flex-col gap-1.5 px-3 py-2.5">
                        {fields.map((field) => (
                            <div
                                key={field.key}
                                className="flex items-center justify-between gap-4 text-xs"
                            >
                                <span className="shrink-0 text-muted-foreground">{field.label}</span>
                                <span className="truncate font-medium">{values[field.key]}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Handle
                type="source"
                position={Position.Right}
                style={{ transform: "translate(100%, -50%)" }}
                className="h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! bg-border!"
            />
        </div>
    )
}

export const StepNode = memo(StepNodeComponent)
