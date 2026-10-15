import type { Stagehand, Page } from "@browserbasehq/stagehand"
import type {
  ActionNodeType,
  NodeType,
} from "@/features/workflows/nodes/node-registry"
import { act } from "./act"
import { aiSynthesize } from "./ai-synthesize"
import { extract } from "./extract"
import { observe } from "./observe"
import { openUrl } from "./open-url"
import { sendEmail } from "./send-email"
import {
  compareQlooTasteOverlap,
  getQlooDemographics,
  getQlooRecommendations,
  searchQlooEntities,
} from "./qloo"

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
  "ai-synthesize": async ({ values }) => {
    if (!values.instruction?.trim()) {
      throw new Error("Enter a synthesis goal for the AI Cultural Synthesizer.")
    }
    return aiSynthesize({
      format: values.format,
      instruction: values.instruction.trim(),
      contextData: values.contextData ?? "",
    })
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
      vibeTags: values.vibeTags,
      negativeSeeds: values.negativeSeeds,
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
      vibeTags: values.vibeTags,
      limit: resultLimit(values.limit),
    })
  },
  "qloo-compare": async ({ values }) => {
    if (!values.firstSeeds?.trim() || !values.secondSeeds?.trim()) {
      throw new Error("Provide taste seeds for both Profile A and Profile B.")
    }
    return compareQlooTasteOverlap({
      firstSeeds: values.firstSeeds,
      secondSeeds: values.secondSeeds,
      targetType: values.targetType || "urn:entity:place",
      city: values.city,
      limit: 6,
    })
  },
  "qloo-demographics": async ({ values }) => {
    if (!values.entityIds?.trim()) {
      throw new Error("Enter at least one entity ID or brand/artist name.")
    }
    return getQlooDemographics({
      entityIds: values.entityIds,
    })
  },
} satisfies Record<ActionNodeType, NodeExecutor>
