import type { Stagehand } from "@browserbasehq/stagehand"

export async function observe({
    stagehand,
    instruction,
}: {
    stagehand: Stagehand
    instruction: string
}) {
    if (!instruction.trim()) {
        throw new Error("Observe instruction is required")
    }

    const result = await stagehand.observe(instruction)

    return {
        matches: result.data.map(({ selector, description }) => ({
            selector,
            description,
        })),
    }
}
