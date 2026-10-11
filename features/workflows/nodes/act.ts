import type { Page, Stagehand } from "@browserbasehq/stagehand"

export async function act({
    stagehand,
    page,
    instruction,
}: {
    stagehand: Stagehand
    page: Page
    instruction: string
}) {
    if (!instruction.trim()) {
        throw new Error("Act instruction is required")
    }

    const result = await stagehand.act(instruction)

    return {
        success: result.data.success,
        message: result.data.message.slice(0, 240),
        url: await page.url(),
    }
}
