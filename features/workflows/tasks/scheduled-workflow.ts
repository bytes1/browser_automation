import { schedules, tasks } from "@trigger.dev/sdk"
import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"
import type { ScheduledWorkflowIdentity } from "@/features/workflows/lib/schedule"

export const scheduledWorkflowTask = schedules.task({
  id: "run-scheduled-workflow",
  run: async ({ externalId }) => {
    if (!externalId) throw new Error("Scheduled workflow is missing its identity.")

    let identity: ScheduledWorkflowIdentity
    try {
      identity = JSON.parse(externalId) as ScheduledWorkflowIdentity
    } catch {
      throw new Error("Scheduled workflow identity is invalid.")
    }

    if (!identity.workflowId || !identity.orgId) {
      throw new Error("Scheduled workflow identity is incomplete.")
    }

    await tasks.trigger<typeof runWorkflowTask>(
      "run-workflow",
      identity,
      {
        tags: [`workflow:${identity.workflowId}`],
        externalDeploymentId: null as unknown as string,
      }
    )
  },
})
