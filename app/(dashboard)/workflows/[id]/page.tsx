import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { getWorkflow } from "@/features/workflows/data"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const { orgId } = await auth()

  if (!orgId) {
    notFound()
  }

  const workflow = await getWorkflow(orgId, id)

  if (!workflow) {
    notFound()
  }

  return <WorkflowShell workflowId={workflow.id} />
}
