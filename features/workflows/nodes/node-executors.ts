import type { Stagehand, Page } from "@browserbasehq/stagehand"
import type {
    ActionNodeType,
    NodeType,
} from "@/features/workflows/nodes/node-registry"
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
} satisfies Record<ActionNodeType, NodeExecutor>