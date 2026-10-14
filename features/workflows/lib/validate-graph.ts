import toposort from "toposort"

import type { WorkflowGraph } from "@/lib/db/schema"
import { buildCronPattern } from "@/features/workflows/lib/schedule"

// Structural problems knowable before a run — empty array means runnable. Pure
// (no db import) so the client can pre-flight the in-hand graph and toast,
// while the server reuses it as the save-time backstop.
export function validateGraph({ nodes, edges }: WorkflowGraph): string[] {
    const problems: string[] = []

    const triggers = nodes.filter((n) => n.data.kind === "trigger").length
    if (triggers !== 1) {
        problems.push(`A workflow needs exactly one trigger (found ${triggers}).`)
    }

    const schedule = nodes.find((node) => node.data.type === "schedule")
    if (schedule) {
        const frequency = schedule.data.values.frequency ?? (schedule.data.values.cron ? "custom" : "daily")
        if (frequency === "once") {
            if (!schedule.data.values.dateTime?.trim()) {
                problems.push("Choose a date and time for the one-time schedule.")
            }
        } else {
            const cron = buildCronPattern(schedule.data.values)
            if (!cron || cron.split(/\s+/).length !== 5) {
                problems.push("Check the schedule details and try again.")
            }
        }
        if (!schedule.data.values.timezone?.trim()) {
            problems.push("Schedule trigger needs a timezone, such as Asia/Kolkata.")
        }
    }

    // The runner only executes nodes touching an edge, so with none Run is a no-op.
    if (edges.length === 0) {
        problems.push("Connect your nodes before running.")
    } else {
        try {
            // toposort throws on a cycle — the run would otherwise fail mid-sort.
            toposort(edges.map((e) => [e.source, e.target]))
        } catch {
            problems.push("Workflow has a cycle — remove the loop before running.")
        }
    }

    return problems
}
