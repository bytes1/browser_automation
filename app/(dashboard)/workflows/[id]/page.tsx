import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { getWorkflow } from "@/features/workflows/data"

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

  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{workflow.name}</h1>
        <p className="text-sm text-muted-foreground">ID: {workflow.id}</p>
      </div>
    </div>
  )
}
