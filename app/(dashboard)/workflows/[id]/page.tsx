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

  const workflow = await getWorkflow(id, orgId)

  if (!workflow) {
    notFound()
  }

  return <WorkflowShell workflowId={workflow.id} />
}
