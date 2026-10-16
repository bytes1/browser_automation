import type { Edge } from "@xyflow/react"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"
import type { WorkflowGraph } from "@/lib/db/schema"

export type TemplateId = "web-to-taste" | "concierge" | "cross-domain" | "local"

export interface WorkflowTemplate {
  id: TemplateId
  name: string
  title: string
  description: string
  badge: string
  buildGraph: (
    center?: { x: number; y: number },
    existingStartId?: string
  ) => {
    startId: string
    nodes: StepNodeType[]
    edges: Edge[]
  }
}

export const WORKFLOW_TEMPLATES: Record<TemplateId, WorkflowTemplate> = {
  "web-to-taste": {
    id: "web-to-taste",
    name: "Web-to-Taste Auto-Discovery",
    title: "Web-to-Taste Brand & Pitch Pipeline",
    description:
      "Open Cultural Page → Stagehand AI Extract → Qloo Entity Resolution → Cross-Domain Brand Match → Gemini Executive Pitch Brief.",
    badge: "Flagship 6-Step",
    buildGraph: (center = { x: 300, y: 200 }, existingStartId = "start") => {
      const startId = existingStartId
      const openId = crypto.randomUUID()
      const extractId = crypto.randomUUID()
      const seedsId = crypto.randomUUID()
      const recsId = crypto.randomUUID()
      const synthId = crypto.randomUUID()

      const nodes: StepNodeType[] = [
        {
          id: startId,
          type: "step",
          position: { x: center.x - 650, y: center.y },
          data: { type: "start", kind: "trigger", title: "Start", values: {} },
        },
        {
          id: openId,
          type: "step",
          position: { x: center.x - 390, y: center.y },
          data: {
            type: "open-url",
            kind: "action",
            title: "Open Cultural Page",
            values: {
              url: "https://en.wikipedia.org/wiki/Studio_Ghibli",
            },
          },
        },
        {
          id: extractId,
          type: "step",
          position: { x: center.x - 130, y: center.y },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract Creators & Works",
            values: {
              instruction:
                "Extract the top 3 iconic film titles or directors mentioned on this page as a comma-separated list",
            },
          },
        },
        {
          id: seedsId,
          type: "step",
          position: { x: center.x + 130, y: center.y },
          data: {
            type: "qloo-search",
            kind: "action",
            title: "Auto-Resolve Qloo Seeds",
            values: {
              query: `{{ ${extractId}.data }}`,
              entityType: "any",
            },
          },
        },
        {
          id: recsId,
          type: "step",
          position: { x: center.x + 390, y: center.y },
          data: {
            type: "qloo-recommend",
            kind: "action",
            title: "Cross-Domain Brand Match",
            values: {
              entityIds: `{{ ${seedsId}.entityIds }}`,
              targetType: "urn:entity:brand",
              city: "",
              vibeTags: "craft, minimalist, design",
              negativeSeeds: "",
              limit: "6",
            },
          },
        },
        {
          id: synthId,
          type: "step",
          position: { x: center.x + 650, y: center.y },
          data: {
            type: "ai-synthesize",
            kind: "action",
            title: "Synthesize Sponsorship Brief",
            values: {
              format: "pitch",
              instruction:
                "Create a brand partnership & cultural affinity pitch deck brief combining the live web extraction and Qloo brand matches.",
              contextData: `Web Extracted Entities: {{ ${extractId}.data }}\nResolved Qloo Seeds: {{ ${seedsId}.summary }}\nQloo Brand Recommendations:\n{{ ${recsId}.summary }}`,
            },
          },
        },
      ]

      const edges: Edge[] = [
        { id: crypto.randomUUID(), source: startId, target: openId },
        { id: crypto.randomUUID(), source: openId, target: extractId },
        { id: crypto.randomUUID(), source: extractId, target: seedsId },
        { id: crypto.randomUUID(), source: seedsId, target: recsId },
        { id: crypto.randomUUID(), source: recsId, target: synthId },
      ]

      return { startId, nodes, edges }
    },
  },

  concierge: {
    id: "concierge",
    name: "Autonomous Cultural Concierge",
    title: "Cultural Concierge (Tokyo Spots)",
    description:
      "Taste Seeds → Tokyo Local Venues → Autonomous Google Web Verification → VIP Email Delivery.",
    badge: "Full Agent Pipeline",
    buildGraph: (center = { x: 300, y: 200 }, existingStartId = "start") => {
      const startId = existingStartId
      const seedsId = crypto.randomUUID()
      const localId = crypto.randomUUID()
      const browseId = crypto.randomUUID()
      const emailId = crypto.randomUUID()

      const nodes: StepNodeType[] = [
        {
          id: startId,
          type: "step",
          position: { x: center.x - 560, y: center.y },
          data: { type: "start", kind: "trigger", title: "Start", values: {} },
        },
        {
          id: seedsId,
          type: "step",
          position: { x: center.x - 280, y: center.y },
          data: {
            type: "qloo-search",
            kind: "action",
            title: "Resolve Cultural Seeds",
            values: {
              query: "Radiohead, Haruki Murakami",
              entityType: "any",
            },
          },
        },
        {
          id: localId,
          type: "step",
          position: { x: center.x, y: center.y },
          data: {
            type: "qloo-local",
            kind: "action",
            title: "Discover Tokyo Venues",
            values: {
              entityIds: `{{ ${seedsId}.entityIds }}`,
              city: "Tokyo",
              limit: "5",
            },
          },
        },
        {
          id: browseId,
          type: "step",
          position: { x: center.x + 280, y: center.y },
          data: {
            type: "open-url",
            kind: "action",
            title: "Autonomous Web Agent",
            values: {
              url: `https://www.google.com/search?q={{ ${localId}.topPickName }}+Tokyo`,
            },
          },
        },
        {
          id: emailId,
          type: "step",
          position: { x: center.x + 560, y: center.y },
          data: {
            type: "send-email",
            kind: "action",
            title: "Deliver VIP Itinerary",
            values: {
              to: "guest@example.com",
              subject: `Your Tokyo Cultural Itinerary: {{ ${localId}.topPickName }}`,
              body: `Hello,\n\nHere is your bespoke cultural itinerary powered by Qloo Taste Intelligence:\n\n⭐ Top Pick: {{ ${localId}.topPickName }}\nWhy Qloo picked this: {{ ${localId}.topPickReason }}\n\nCurated Recommendations:\n{{ ${localId}.summary }}\n\nVerified via Autonomous Web Agent.\nEnjoy!`,
            },
          },
        },
      ]

      const edges: Edge[] = [
        { id: crypto.randomUUID(), source: startId, target: seedsId },
        { id: crypto.randomUUID(), source: seedsId, target: localId },
        { id: crypto.randomUUID(), source: localId, target: browseId },
        { id: crypto.randomUUID(), source: browseId, target: emailId },
      ]

      return { startId, nodes, edges }
    },
  },

  "cross-domain": {
    id: "cross-domain",
    name: "Cross-Domain Taste Scout",
    title: "Brand Affinity Scout",
    description:
      "Cinema Seeds → Aligned Lifestyle Brands → Brand Affinity Report Email.",
    badge: "Cross-Category",
    buildGraph: (center = { x: 300, y: 200 }, existingStartId = "start") => {
      const startId = existingStartId
      const seedsId = crypto.randomUUID()
      const recsId = crypto.randomUUID()
      const emailId = crypto.randomUUID()

      const nodes: StepNodeType[] = [
        {
          id: startId,
          type: "step",
          position: { x: center.x - 420, y: center.y },
          data: { type: "start", kind: "trigger", title: "Start", values: {} },
        },
        {
          id: seedsId,
          type: "step",
          position: { x: center.x - 140, y: center.y },
          data: {
            type: "qloo-search",
            kind: "action",
            title: "Cinema Aesthetic Seeds",
            values: {
              query: "Wes Anderson, Studio Ghibli",
              entityType: "urn:entity:movie",
            },
          },
        },
        {
          id: recsId,
          type: "step",
          position: { x: center.x + 140, y: center.y },
          data: {
            type: "qloo-recommend",
            kind: "action",
            title: "Aligned Lifestyle Brands",
            values: {
              entityIds: `{{ ${seedsId}.entityIds }}`,
              targetType: "urn:entity:brand",
              city: "",
              limit: "6",
            },
          },
        },
        {
          id: emailId,
          type: "step",
          position: { x: center.x + 420, y: center.y },
          data: {
            type: "send-email",
            kind: "action",
            title: "Email Aesthetic Report",
            values: {
              to: "curator@example.com",
              subject: "Cross-Domain Brand Affinity Report",
              body: `Cross-domain taste analysis powered by Qloo Taste Intelligence:\n\nTop Pick: {{ ${recsId}.topPickName }}\nWhy: {{ ${recsId}.topPickReason }}\n\nRecommendations:\n{{ ${recsId}.summary }}`,
            },
          },
        },
      ]

      const edges: Edge[] = [
        { id: crypto.randomUUID(), source: startId, target: seedsId },
        { id: crypto.randomUUID(), source: seedsId, target: recsId },
        { id: crypto.randomUUID(), source: recsId, target: emailId },
      ]

      return { startId, nodes, edges }
    },
  },

  local: {
    id: "local",
    name: "Local Places Explorer",
    title: "Local Hotspots Discovery",
    description:
      "Music Artist Seeds → Hyper-local NYC Dining & Nightlife Discovery.",
    badge: "Local Discovery",
    buildGraph: (center = { x: 300, y: 200 }, existingStartId = "start") => {
      const startId = existingStartId
      const seedsId = crypto.randomUUID()
      const localId = crypto.randomUUID()

      const nodes: StepNodeType[] = [
        {
          id: startId,
          type: "step",
          position: { x: center.x - 300, y: center.y },
          data: { type: "start", kind: "trigger", title: "Start", values: {} },
        },
        {
          id: seedsId,
          type: "step",
          position: { x: center.x, y: center.y },
          data: {
            type: "qloo-search",
            kind: "action",
            title: "Favorite Artist",
            values: { query: "Radiohead", entityType: "urn:entity:artist" },
          },
        },
        {
          id: localId,
          type: "step",
          position: { x: center.x + 300, y: center.y },
          data: {
            type: "qloo-local",
            kind: "action",
            title: "Discover New York Places",
            values: {
              entityIds: `{{ ${seedsId}.entityIds }}`,
              city: "New York",
              limit: "8",
            },
          },
        },
      ]

      const edges: Edge[] = [
        { id: crypto.randomUUID(), source: startId, target: seedsId },
        { id: crypto.randomUUID(), source: seedsId, target: localId },
      ]

      return { startId, nodes, edges }
    },
  },
}

export function getTemplateGraph(
  templateId: TemplateId,
  center?: { x: number; y: number },
  existingStartId?: string
): WorkflowGraph {
  const template = WORKFLOW_TEMPLATES[templateId]
  if (!template) {
    throw new Error(`Unknown template ID: ${templateId}`)
  }
  const { nodes, edges } = template.buildGraph(center, existingStartId)
  return { nodes, edges }
}
