import type { Edge } from "@xyflow/react"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"
import type { WorkflowGraph } from "@/lib/db/schema"

export type TemplateId =
  | "web-to-taste"
  | "concierge"
  | "cross-domain"
  | "local"
  | "cultural-positioning"

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
  "cultural-positioning": {
    id: "cultural-positioning",
    name: "Subculture Positioning & Competitor Intel",
    title: "Startup Subculture & Competitor Positioning",
    description:
      "Drop your live startup URL to see how 3 cultural subcultures perceive your product, scrape competitor positioning for each persona, and synthesize a GTM brief.",
    badge: "Founder GTM + 3 Personas",
    buildGraph: (center = { x: 300, y: 200 }, existingStartId = "start") => {
      const startId = existingStartId
      const siteId = crypto.randomUUID()
      const productId = crypto.randomUUID()
      const synthId = crypto.randomUUID()

      const personas = [
        {
          key: "design",
          title: "Design & Indie Craft",
          seeds: "A24, Wes Anderson, Teenage Engineering",
          vibeTags: "minimalist, craft, design",
          competitorUrl: "https://www.raycast.com",
          competitorLabel: "Raycast (Design-Led)",
          row: center.y - 330,
        },
        {
          key: "operator",
          title: "High-Growth Tech Operators",
          seeds: "Christopher Nolan, Wired, Apple",
          vibeTags: "modern, high-performance, scale",
          competitorUrl: "https://vercel.com",
          competitorLabel: "Vercel (Scale-Led)",
          row: center.y,
        },
        {
          key: "creator",
          title: "Creator & Gaming Subculture",
          seeds: "Studio Ghibli, Nintendo, Discord",
          vibeTags: "playful, community, creator",
          competitorUrl: "https://supabase.com",
          competitorLabel: "Supabase (Community-Led)",
          row: center.y + 330,
        },
      ]

      const nodes: StepNodeType[] = [
        {
          id: startId,
          type: "step",
          position: { x: center.x - 860, y: center.y },
          data: { type: "start", kind: "trigger", title: "Start", values: {} },
        },
        {
          id: siteId,
          type: "step",
          position: { x: center.x - 600, y: center.y },
          data: {
            type: "open-url",
            kind: "action",
            title: "Your Startup Website (Drop URL)",
            values: { url: "https://linear.app" },
          },
        },
        {
          id: productId,
          type: "step",
          position: { x: center.x - 320, y: center.y },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract Product Positioning",
            values: {
              instruction:
                "From this startup's live website, extract the company name, product category, hero headline, core value proposition, target audience, and top 3 positioning claims.",
            },
          },
        },
      ]

      const edges: Edge[] = [
        { id: crypto.randomUUID(), source: startId, target: siteId },
        { id: crypto.randomUUID(), source: siteId, target: productId },
      ]

      const personaContext: string[] = []

      for (const persona of personas) {
        const seedsId = crypto.randomUUID()
        const demographicsId = crypto.randomUUID()
        const brandsId = crypto.randomUUID()
        const compOpenId = crypto.randomUUID()
        const compExtractId = crypto.randomUUID()
        const row = persona.row

        nodes.push(
          {
            id: seedsId,
            type: "step",
            position: { x: center.x - 40, y: row },
            data: {
              type: "qloo-search",
              kind: "action",
              title: `${persona.title} Seeds`,
              values: { query: persona.seeds, entityType: "any" },
            },
          },
          {
            id: demographicsId,
            type: "step",
            position: { x: center.x + 240, y: row - 105 },
            data: {
              type: "qloo-demographics",
              kind: "action",
              title: `${persona.title} Persona`,
              values: { entityIds: `{{ ${seedsId}.entityIds }}` },
            },
          },
          {
            id: brandsId,
            type: "step",
            position: { x: center.x + 240, y: row + 105 },
            data: {
              type: "qloo-recommend",
              kind: "action",
              title: `${persona.title} Brand Affinities`,
              values: {
                entityIds: `{{ ${seedsId}.entityIds }}`,
                targetType: "urn:entity:brand",
                city: "",
                vibeTags: persona.vibeTags,
                negativeSeeds: "",
                limit: "5",
              },
            },
          },
          {
            id: compOpenId,
            type: "step",
            position: { x: center.x + 530, y: row + 105 },
            data: {
              type: "open-url",
              kind: "action",
              title: `Competitor: ${persona.competitorLabel}`,
              values: {
                url: persona.competitorUrl,
              },
            },
          },
          {
            id: compExtractId,
            type: "step",
            position: { x: center.x + 810, y: row + 105 },
            data: {
              type: "extract",
              kind: "action",
              title: `${persona.title} Competitor Messaging`,
              values: {
                instruction:
                  "Extract this competitor's hero headline, core positioning hook, target persona appeal, and top 3 proof points or differentiators.",
              },
            },
          }
        )

        edges.push(
          { id: crypto.randomUUID(), source: productId, target: seedsId },
          { id: crypto.randomUUID(), source: seedsId, target: demographicsId },
          { id: crypto.randomUUID(), source: seedsId, target: brandsId },
          { id: crypto.randomUUID(), source: brandsId, target: compOpenId },
          { id: crypto.randomUUID(), source: compOpenId, target: compExtractId },
          { id: crypto.randomUUID(), source: demographicsId, target: synthId },
          { id: crypto.randomUUID(), source: compExtractId, target: synthId }
        )

        personaContext.push(
          `[${persona.title} Subculture]\nQloo Seeds: {{ ${seedsId}.summary }}\nAudience Demographics: {{ ${demographicsId}.personaSummary }}\nAligned Cultural Brands:\n{{ ${brandsId}.summary }}\nCompetitor (${persona.competitorLabel}) Live Positioning:\n{{ ${compExtractId}.data }}`
        )
      }

      nodes.push({
        id: synthId,
        type: "step",
        position: { x: center.x + 1110, y: center.y },
        data: {
          type: "ai-synthesize",
          kind: "action",
          title: "Subculture Perception & Positioning Brief",
          values: {
            format: "brief",
            instruction:
              "Create a founder-ready Subculture Perception & Competitor Positioning Brief. Compare how each of the 3 cultural subcultures (Design & Indie Craft, High-Growth Tech Operators, and Creator & Gaming Subculture) perceives the founder's live website positioning versus the scraped competitor messaging for that persona. For each subculture, provide: (1) Cultural perception & resonance score rationale based on Qloo brand affinities and demographics, (2) How the competitor frames their hook for this persona, and (3) Concrete landing-page copy and positioning recommendations the founder can ship immediately.",
            contextData: `Founder's Live Website Positioning:\n{{ ${productId}.data }}\n\n${personaContext.join("\n\n")}`,
          },
        },
      })

      edges.push({ id: crypto.randomUUID(), source: productId, target: synthId })

      return { startId, nodes, edges }
    },
  },

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
