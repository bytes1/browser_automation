import { createClerkClient } from "@clerk/backend"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getWorkflow } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
})

/**
 * POST /api/liveblocks-auth
 *
 * Called automatically by the Liveblocks client when it needs to authenticate.
 * Issues a room-scoped Liveblocks access token after checking that the
 * requested workflow belongs to the user's active Clerk organization.
 */
export async function POST(request: Request): Promise<NextResponse> {
    const { userId, orgId } = await auth()

    if (!userId || !orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let roomId: unknown
    try {
        ({ room: roomId } = await request.json())
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (typeof roomId !== "string" || !roomId.trim()) {
        return NextResponse.json({ error: "A room ID is required" }, { status: 400 })
    }

    // Room IDs are workflow IDs. Check ownership on every auth request so a
    // user cannot request a token for another organization's workflow.
    const workflow = await getWorkflow(orgId, roomId)
    if (!workflow) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch the user's info from Clerk to populate the Liveblocks UserMeta.
    let userInfo: { name: string; avatar?: string }
    try {
        const user = await clerkClient.users.getUser(userId)
        const name =
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
            user.username ||
            user.primaryEmailAddress?.emailAddress ||
            "Unknown"

        userInfo = { name, avatar: user.imageUrl || undefined }
    } catch (err) {
        console.error("[/api/liveblocks-auth] Failed to fetch Clerk user:", err)
        userInfo = { name: "Unknown" }
    }

    // Explicitly grant this workflow room. identifyUser() only identifies the
    // user for Liveblocks Permissions API access and does not grant room access.
    const session = liveblocks.prepareSession(userId, {
        userInfo,
        organizationId: orgId,
    })
    session.allow(roomId, ["*:write"])
    const { body, status } = await session.authorize()

    return new NextResponse(body, { status })
}
