import type { Stagehand, Page } from "@browserbasehq/stagehand"
import type {
  ActionNodeType,
  NodeType,
} from "@/features/workflows/nodes/node-registry"
import { act } from "./act"
import { extract } from "./extract"
import { observe } from "./observe"
import { openUrl } from "./open-url"
import { sendEmail } from "./send-email"
import { getQlooRecommendations, searchQlooEntities } from "./qloo"

function resultLimit(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "8", 10)
  return Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 8
}

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
  "send-email": async ({ values }) => {
    return sendEmail({
      provider: values.provider,
      to: values.to,
      subject: values.subject,
      body: values.body,
    })
  },
  "qloo-search": async ({ values }) => {
    if (!values.query?.trim())
      throw new Error("Enter a favorite to search for.")
    return searchQlooEntities({
      query: values.query.trim(),
      entityType: values.entityType,
      limit: 5,
    })
  },
  "qloo-recommend": async ({ values }) => {
    if (!values.targetType) throw new Error("Choose a category to recommend.")
    return getQlooRecommendations({
      entityIds: values.entityIds,
      targetType: values.targetType,
      city: values.city,
      limit: resultLimit(values.limit),
    })
  },
  "qloo-local": async ({ values }) => {
    if (!values.city?.trim())
      throw new Error("Enter a city for local discovery.")
    return getQlooRecommendations({
      entityIds: values.entityIds,
      targetType: "urn:entity:place",
      city: values.city,
      limit: resultLimit(values.limit),
    })
  },
} satisfies Record<ActionNodeType, NodeExecutor>
