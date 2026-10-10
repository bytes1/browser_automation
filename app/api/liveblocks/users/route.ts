import { createClerkClient } from "@clerk/backend"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
})

type UserInfo = {
    name: string
    avatar?: string
} | null

/**
 * POST /api/liveblocks/users
 *
 * Body: { userIds: string[] }
 *
 * Returns the Liveblocks UserMeta.info for each requested user ID, in the
 * same order as the input array. Unknown / missing users are returned as null.
 *
 * Called by the Liveblocks resolveUsers callback on the client.
 * Requires an authenticated Clerk user that belongs to an organisation.
 */
export async function POST(request: Request): Promise<NextResponse> {
    // 1. Require an authenticated user with an active org.
    const { userId, orgId } = await auth()

    if (!userId || !orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse and validate the request body.
    let userIds: unknown
    try {
        ;({ userIds } = await request.json())
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    if (
        !Array.isArray(userIds) ||
        userIds.length === 0 ||
        userIds.some((id) => typeof id !== "string")
    ) {
        return NextResponse.json(
            { error: "userIds must be a non-empty array of strings" },
            { status: 400 }
        )
    }

    // 3. Fetch all requested users in a single Clerk API call.
    //    getUserList accepts up to 100 user IDs at once.
    const typedUserIds = userIds as string[]

    let clerkUsers: Map<string, { name: string; avatar?: string }>
    try {
        const { data } = await clerkClient.users.getUserList({
            userId: typedUserIds,
            limit: typedUserIds.length,
        })

        clerkUsers = new Map(
            data.map((user) => {
                const name =
                    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
                    user.username ||
                    user.primaryEmailAddress?.emailAddress ||
                    "Unknown"

                return [
                    user.id,
                    {
                        name,
                        // imageUrl is always present on the User resource
                        avatar: user.imageUrl || undefined,
                    },
                ]
            })
        )
    } catch (err) {
        console.error("[/api/liveblocks/users] Clerk fetch failed:", err)
        return NextResponse.json(
            { error: "Failed to resolve users" },
            { status: 502 }
        )
    }

    // 4. Return results in the same order as the input, null for unknowns.
    const usersInfo: UserInfo[] = typedUserIds.map(
        (id) => clerkUsers.get(id) ?? null
    )

    return NextResponse.json(usersInfo)
}
