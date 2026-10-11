import type { Stagehand } from "@browserbasehq/stagehand"

export async function extract({
    stagehand,
    instruction,
}: {
    stagehand: Stagehand
    instruction: string
}) {
    if (!instruction.trim()) {
        throw new Error("Extract instruction is required")
    }

    const result = await stagehand.extract(instruction)

    return { data: result.data.extraction }
}
