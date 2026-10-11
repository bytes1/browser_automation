import type { Stagehand, Page } from "@browserbasehq/stagehand"
import type {
    ActionNodeType,
    NodeType,
} from "@/features/workflows/nodes/node-registry"
import { act } from "./act"
import { extract } from "./extract"
import { observe } from "./observe"
import { openUrl } from "./open-url"

export type NodeContext = {
    values: Record<string, string>
    getStagehand: () => Promise<{ stagehand: Stagehand; page: Page }>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
    "open-url": async ({ values, getStagehand }) => {
        const { page } = await getStagehand()
        return openUrl({ page, url: values.url })
    },
    act: async ({ values, getStagehand }) => {
        const { stagehand, page } = await getStagehand()
        return act({ stagehand, page, instruction: values.instruction })
    },
    extract: async ({ values, getStagehand }) => {
        const { stagehand } = await getStagehand()
        return extract({ stagehand, instruction: values.instruction })
    },
    observe: async ({ values, getStagehand }) => {
        const { stagehand } = await getStagehand()
        return observe({ stagehand, instruction: values.instruction })
    },
} satisfies Record<ActionNodeType, NodeExecutor>
