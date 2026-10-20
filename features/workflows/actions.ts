"use server"

import { auth } from "@clerk/nextjs/server"
import { runs, schedules, tasks } from "@trigger.dev/sdk"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"

import { liveblocks } from "@/lib/liveblocks"
import {
    createWorkflow,
    deleteWorkflow,
    getWorkflow,
    saveWorkflowGraph,
    saveWorkflowTriggerRef,
} from "@/features/workflows/data"
import { WorkflowGraph } from "@/lib/db/schema"
import {
    getTemplateGraph,
    WORKFLOW_TEMPLATES,
    type TemplateId,
} from "@/features/workflows/lib/templates"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import {
    buildCronPattern,
    getWorkflowTriggerRef,
    workflowScheduleExternalId,
    zonedDateTimeToUtc,
    type WorkflowTriggerRef,
} from "@/features/workflows/lib/schedule"

const scheduledWorkflowTaskId = "run-scheduled-workflow"

async function getWorkspaceId(): Promise<string> {
    const { orgId, userId } = await auth()
    const workspaceId = orgId ?? userId
    if (!workspaceId) {
        throw new Error("Please sign in to manage workflows.")
    }
    return workspaceId
}

async function removeWorkflowTrigger(ref: WorkflowTriggerRef | null) {
    if (!ref) return
    if (ref.kind === "schedule") {
        await schedules.del(ref.id)
        return
    }

    const run = await runs.retrieve(ref.id)
    if (run.status === "DELAYED") await runs.cancel(ref.id)
}

async function removeLegacyWorkflowSchedules(workflowId: string, orgId: string) {
    const externalId = workflowScheduleExternalId(workflowId, orgId)
    for await (const schedule of schedules.list({ perPage: 100 })) {
        if (
            schedule.task === scheduledWorkflowTaskId &&
            schedule.externalId === externalId
        ) {
            await schedules.del(schedule.id)
        }
    }
}

export async function createWorkflowAction(name?: string, templateId?: TemplateId) {
    const orgId = await getWorkspaceId()

    let graph: WorkflowGraph | undefined
    let workflowName = name?.trim()

    if (templateId && WORKFLOW_TEMPLATES[templateId]) {
        graph = getTemplateGraph(templateId)
        if (!workflowName) {
            workflowName = `${WORKFLOW_TEMPLATES[templateId].title} (${generateSlug().slice(0, 8)})`
        }
    }

    if (!workflowName) {
        workflowName = generateSlug()
    }

    const workflow = await createWorkflow(orgId, workflowName, graph)

    revalidatePath("/launch")
    revalidatePath("/workflows", "layout")
    redirect(`/workflows/${workflow.id}`)
}

export async function deleteWorkflowAction(id: string) {
    const orgId = await getWorkspaceId()

    const existing = await getWorkflow(orgId, id)
    const triggerRef = getWorkflowTriggerRef(existing?.graph)
    if (triggerRef) await removeWorkflowTrigger(triggerRef)
    else await removeLegacyWorkflowSchedules(id, orgId)
    const workflow = await deleteWorkflow(orgId, id)

    if (!workflow) {
        throw new Error("Workflow not found")
    }

    // The workflow id doubles as its Liveblocks room id — clean it up too.
    await liveblocks.deleteRoom(id).catch(() => {})

    revalidatePath("/launch")
    revalidatePath("/workflows", "layout")
    redirect("/launch")
}

export async function saveWorkflowScheduleAction({
    id,
    graph,
}: {
    id: string
    graph: WorkflowGraph
}) {
    const orgId = await getWorkspaceId()

    const existing = await getWorkflow(orgId, id)
    if (!existing) throw new Error("Workflow not found")

    const trigger = graph.nodes.find((node) => node.data.kind === "trigger")
    if (trigger?.data.type === "schedule") {
        const timezone = trigger.data.values.timezone?.trim()
        if (!timezone) throw new Error("Enter a timezone, such as Asia/Kolkata.")

        await saveWorkflowGraph({ orgId, id, graph })
        const frequency = trigger.data.values.frequency ?? (trigger.data.values.cron ? "custom" : "daily")
        let nextRun: Date | null
        let newRef: WorkflowTriggerRef

        if (frequency === "once") {
            nextRun = zonedDateTimeToUtc(trigger.data.values.dateTime ?? "", timezone)
            if (nextRun.getTime() <= Date.now()) {
                throw new Error("Choose a future date and time for the one-time run.")
            }
            const handle = await tasks.trigger<typeof runWorkflowTask>(
                "run-workflow",
                { workflowId: id, orgId },
                {
                    delay: nextRun,
                    tags: [`workflow:${id}`],
                    idempotencyKey: `workflow-once:${orgId}:${id}:${nextRun.toISOString()}`,
                    externalDeploymentId: null as unknown as string,
                }
            )
            newRef = { kind: "run", id: handle.id }
        } else {
            const cron = buildCronPattern(trigger.data.values)
            if (!cron || cron.split(/\s+/).length !== 5) {
                throw new Error("Check the schedule details and try again.")
            }
            const externalId = workflowScheduleExternalId(id, orgId)
            const environment = process.env.TRIGGER_ENVIRONMENT ?? process.env.NODE_ENV ?? "default"
            const schedule = await schedules.create({
                task: scheduledWorkflowTaskId,
                cron,
                timezone,
                externalId,
                deduplicationKey: `workflow:${environment}:${orgId}:${id}`,
                window: "0m",
            })
            newRef = { kind: "schedule", id: schedule.id }
            nextRun = schedule.nextRun ?? null
        }

        const oldRef = getWorkflowTriggerRef(existing.graph)
        if (!(oldRef?.kind === newRef.kind && oldRef.id === newRef.id)) {
            if (oldRef) await removeWorkflowTrigger(oldRef)
            else if (newRef.kind !== "schedule") {
                await removeLegacyWorkflowSchedules(id, orgId)
            }
        }
        await saveWorkflowTriggerRef({ orgId, id, triggerRef: JSON.stringify(newRef) })

        return {
            scheduled: true,
            mode: frequency === "once" ? "once" : "recurring",
            nextRun: nextRun?.toISOString() ?? null,
        }
    }

    await saveWorkflowGraph({ orgId, id, graph })
    const oldRef = getWorkflowTriggerRef(existing.graph)
    if (oldRef) await removeWorkflowTrigger(oldRef)
    else await removeLegacyWorkflowSchedules(id, orgId)
    await saveWorkflowTriggerRef({ orgId, id, triggerRef: null })
    return { scheduled: false, nextRun: null }
}

export async function runWorkflowAction({
    id,
    graph,
}: {
    id: string
    graph: WorkflowGraph
}) {
    const orgId = await getWorkspaceId()

    await saveWorkflowGraph({ orgId, id, graph })

    const handle = await tasks.trigger<typeof runWorkflowTask>(
        "run-workflow",
        { workflowId: id, orgId },
        {
            tags: [`workflow:${id}`],
            externalDeploymentId: null as unknown as string,
        }
    )

    return {
        runId: handle.id,
        accessToken: handle.publicAccessToken,
    }
}

export async function cancelWorkflowRunAction(runId: string) {
    await getWorkspaceId()
    await runs.cancel(runId)
}
