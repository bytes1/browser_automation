import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { WorkflowGraph, workflows } from "@/lib/db/schema"
import { validateGraph } from "@/features/workflows/lib/validate-graph"
import {
    getWorkflowTriggerRef,
    setWorkflowTriggerRefInGraph,
} from "@/features/workflows/lib/schedule"

export async function saveWorkflowGraph({
    orgId,
    id,
    graph,
}: {
    orgId: string
    id: string
    graph: WorkflowGraph
}) {
    const problems = validateGraph(graph)
    if (problems.length > 0) throw new Error(problems.join(" "))
    const [existing] = await db
        .select({ graph: workflows.graph })
        .from(workflows)
        .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
    const triggerRef = getWorkflowTriggerRef(existing?.graph)
    const graphWithTriggerRef = triggerRef
        ? setWorkflowTriggerRefInGraph(graph, triggerRef)
        : graph
    await db
        .update(workflows)
        .set({ graph: graphWithTriggerRef, updatedAt: new Date() })
        .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
}

export async function saveWorkflowTriggerRef({
    orgId,
    id,
    triggerRef,
}: {
    orgId: string
    id: string
    triggerRef: string | null
}) {
    const [workflow] = await db
        .select({ graph: workflows.graph })
        .from(workflows)
        .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
    if (!workflow?.graph) throw new Error("Workflow not found")

    const ref = triggerRef ? JSON.parse(triggerRef) : null
    const graph = setWorkflowTriggerRefInGraph(workflow.graph, ref)
    await db
        .update(workflows)
        .set({ graph, updatedAt: new Date() })
        .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
}

export function listWorkflows(orgId: string) {
    return db
        .select()
        .from(workflows)
        .where(eq(workflows.orgId, orgId))
        .orderBy(desc(workflows.createdAt))
}

export async function getWorkflow(orgId: string, id: string) {
    const [workflow] = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))

    return workflow
}

export async function createWorkflow(
    orgId: string,
    name: string,
    graph?: WorkflowGraph
) {
    const [workflow] = await db
        .insert(workflows)
        .values({ orgId, name, graph })
        .returning()

    return workflow
}

export async function deleteWorkflow(orgId: string, id: string) {
    const [workflow] = await db
        .delete(workflows)
        .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
        .returning()

    return workflow
}
