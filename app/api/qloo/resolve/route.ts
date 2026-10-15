import { auth } from "@clerk/nextjs/server"
import { searchQlooEntities } from "@/features/workflows/nodes/qloo"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { query?: string; entityType?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const query = body.query?.trim()
  if (!query || query.includes("{{")) {
    return Response.json(
      {
        error:
          "Enter static favorite names (without {{ }} template tokens) to preview live Qloo entities.",
      },
      { status: 400 }
    )
  }

  try {
    const result = await searchQlooEntities({
      query,
      entityType: body.entityType,
      limit: 3,
    })
    return Response.json({
      entities: result.entities.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type.replace("urn:entity:", "").replaceAll("_", " "),
      })),
      summary: result.summary,
    })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not resolve Qloo entities.",
      },
      { status: 422 }
    )
  }
}

