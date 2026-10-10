import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { workflows, type Workflow } from "@/lib/db/schema"

export async function listWorkflows(orgId: string): Promise<Workflow[]> {
    return await db
        .select()
        .from(workflows)
        .where(eq(workflows.orgId, orgId))
        .orderBy(desc(workflows.createdAt))
}

export async function createWorkflow(orgId: string, name: string): Promise<Workflow> {
    const [workflow] = await db
        .insert(workflows)
        .values({ orgId, name })
        .returning()

    if (!workflow) {
        throw new Error("Failed to create workflow")
    }

    return workflow
}

export async function getWorkflow(id: string, orgId: string): Promise<Workflow | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) {
        return null
    }

    const [workflow] = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))

    return workflow ?? null
}