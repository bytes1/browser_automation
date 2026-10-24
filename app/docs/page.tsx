"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  Compass,
  Copy,
  Eye,
  GitCompareArrows,
  Globe,
  Layers,
  MapPin,
  MonitorPlay,
  Play,
  Plus,
  Search,
  Sparkles,
  Terminal,
  Users,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  nodeRegistry,
  type NodeDefinition,
} from "@/features/workflows/nodes/node-registry"

type NodeCategoryFilter = "all" | "qloo" | "browser" | "ai-delivery" | "trigger"

const SECTIONS = [
  { id: "quickstart", label: "1. Quickstart (60s)", icon: Zap },
  { id: "architecture", label: "2. How Browsevibe Works", icon: Layers },
  { id: "nodes", label: "3. Node Catalog (12 Nodes)", icon: Workflow },
  { id: "piping", label: "4. Data Piping {{ }}", icon: GitCompareArrows },
  { id: "ai-builder", label: "5. Wispr Flow & AI Builder", icon: Bot },
  { id: "qloo-guide", label: "6. Cultural Taste AI Guide", icon: Sparkles },
  { id: "console", label: "7. Live Console & Replay", icon: MonitorPlay },
  { id: "templates", label: "8. Starter Blueprints", icon: Compass },
  { id: "setup", label: "9. Local Setup & Env", icon: Terminal },
]

const QLOO_DOMAINS = [
  { urn: "urn:entity:artist", label: "Artist / Musician", example: "Radiohead, Daft Punk, Ryuichi Sakamoto" },
  { urn: "urn:entity:place", label: "Place / Venue / Dining", example: "Blue Bottle, Bar Benfiddich, Dover Street Market" },
  { urn: "urn:entity:movie", label: "Movie / Film", example: "Spirited Away, Past Lives, Grand Budapest Hotel" },
  { urn: "urn:entity:tv_show", label: "TV Show", example: "The Bear, Severance, Succession" },
  { urn: "urn:entity:book", label: "Book / Author", example: "Haruki Murakami, Kafka on the Shore" },
  { urn: "urn:entity:brand", label: "Brand / Fashion / Lifestyle", example: "Acne Studios, Aesop, Le Labo, Muji" },
  { urn: "urn:entity:podcast", label: "Podcast", example: "99% Invisible, Acquired, Song Exploder" },
  { urn: "urn:entity:video_game", label: "Video Game", example: "Disco Elysium, Zelda: Tears of the Kingdom" },
  { urn: "urn:entity:destination", label: "Travel Destination", example: "Kyoto, Reykjavik, Lisbon" },
  { urn: "urn:entity:person", label: "Person / Creator", example: "Wes Anderson, Hayao Miyazaki, Greta Gerwig" },
]

function getNodeCategory(type: string): NodeCategoryFilter {
  if (type === "start" || type === "schedule") return "trigger"
  if (type.startsWith("qloo-")) return "qloo"
  if (["open-url", "act", "extract", "observe"].includes(type)) return "browser"
  return "ai-delivery"
}

function CopyTokenButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(token)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy token"
      className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:border-violet-500/40 hover:bg-violet-500/10"
    >
      <span>{token}</span>
      {copied ? (
        <Check className="size-3 text-emerald-500" />
      ) : (
        <Copy className="size-3 text-muted-foreground" />
      )}
    </button>
  )
}

export default function DocsPage() {
  const [nodeFilter, setNodeFilter] = useState<NodeCategoryFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const allNodes = useMemo(
    () => Object.values(nodeRegistry) as NodeDefinition[],
    []
  )

  const filteredNodes = useMemo(() => {
    return allNodes.filter((node) => {
      const matchesCategory =
        nodeFilter === "all" || getNodeCategory(node.type) === nodeFilter
      const q = searchQuery.trim().toLowerCase()
      if (!q) return matchesCategory
      const inLabel = node.label.toLowerCase().includes(q)
      const inType = node.type.toLowerCase().includes(q)
      const inFields = node.fields.some(
        (f) =>
          f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)
      )
      const inOutputs = node.outputs.some(
        (o) =>
          o.label.toLowerCase().includes(q) || o.path.toLowerCase().includes(q)
      )
      return matchesCategory && (inLabel || inType || inFields || inOutputs)
    })
  }, [allNodes, nodeFilter, searchQuery])

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
                <Workflow className="size-4" />
              </span>
              <span>Browsevibe</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-300">
              <BookOpen className="size-3" />
              Documentation &amp; User Guide
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="size-3.5" />
                Landing Page
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/launch">
                Open Workflow Studio
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Left Sticky Sidebar Navigation */}
        <aside className="hidden lg:block">
          <div className="sticky top-22 space-y-6">
            <div>
              <p className="mb-2 px-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                On this page
              </p>
              <nav className="space-y-0.5">
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Icon className="size-3.5 shrink-0 text-violet-500" />
                      <span className="truncate">{sec.label}</span>
                    </a>
                  )
                })}
              </nav>
            </div>

            <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Sparkles className="size-3.5 text-violet-500" />
                Ready to build?
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Launch a pre-wired Qloo Cultural AI template or build with the
                conversational AI Agent.
              </p>
              <Button size="sm" className="mt-3 w-full" asChild>
                <Link href="/launch">
                  <Plus className="size-3.5" />
                  Create a Workflow
                </Link>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 space-y-14 pb-20">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 via-background to-fuchsia-500/5 p-6 sm:p-8">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-300">
                <Sparkles className="size-3.5" />
                Complete User &amp; Developer Guide · Voice, Browser &amp; Cultural AI Studio
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
                Welcome to Browsevibe
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Browsevibe is a visual, multiplayer AI workflow studio that
                combines{" "}
                <strong className="font-medium text-foreground">
                  Wispr Flow voice-to-workflow control
                </strong>
                ,{" "}
                <strong className="font-medium text-foreground">
                  self-healing cloud stealth browsers (Browserbase + Stagehand
                  v4)
                </strong>
                ,{" "}
                <strong className="font-medium text-foreground">
                  Qloo&apos;s Taste AI™ cultural affinity graph
                </strong>
                ,{" "}
                <strong className="font-medium text-foreground">
                  Google Gemini synthesis
                </strong>
                , and{" "}
                <strong className="font-medium text-foreground">
                  Trigger.dev durable execution
                </strong>
                . This guide walks you through everything from creating your
                first workflow in 60 seconds to mastering every node.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <Button asChild>
                  <Link href="/launch">
                    Launch Canvas Studio
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#quickstart">Jump to 60-Second Quickstart</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#nodes">Browse All 12 Nodes</a>
                </Button>
              </div>
            </div>
          </div>

          {/* 1. QUICKSTART */}
          <section id="quickstart" className="scroll-mt-20 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                Section 01
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                60-Second Quickstart: Your First Workflow
              </h2>
              <p className="text-sm text-muted-foreground">
                There are three ways to create and run a workflow in Browsevibe.
                Pick whichever fits your style:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col justify-between rounded-xl border bg-card p-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500">
                      <Compass className="size-4" />
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Fastest (Recommended)
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold">
                    Option A: 1-Click Starter Blueprint
                  </h3>
                  <ol className="list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                    <li>
                      Open{" "}
                      <Link
                        href="/launch"
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        /launch
                      </Link>{" "}
                      and click one of the 5 starter templates (e.g.,{" "}
                      <strong>Web-to-Taste Auto-Discovery</strong>).
                    </li>
                    <li>
                      Or inside any open canvas, go to the right sidebar →{" "}
                      <strong>Toolbar</strong> tab →{" "}
                      <strong>Starter Workflow Blueprints</strong>.
                    </li>
                    <li>
                      Click the{" "}
                      <strong className="text-foreground">Run</strong> button
                      (▶) in the top-right header to execute immediately.
                    </li>
                  </ol>
                </div>
                <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/launch">Try a Starter Template</Link>
                </Button>
              </div>

              <div className="flex flex-col justify-between rounded-xl border bg-card p-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                      <Bot className="size-4" />
                    </span>
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      Natural Language
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold">
                    Option B: Ask the AI Agent Builder
                  </h3>
                  <ol className="list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                    <li>
                      Click <strong>+ New workflow</strong> on{" "}
                      <Link
                        href="/launch"
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        /launch
                      </Link>
                      .
                    </li>
                    <li>
                      In the right sidebar, switch to the{" "}
                      <strong className="text-foreground">AI</strong> tab.
                    </li>
                    <li>
                      Type a prompt like:{" "}
                      <em>
                        &ldquo;Find Tokyo venues aligned with Radiohead &amp;
                        Haruki Murakami and synthesize a VIP itinerary.&rdquo;
                      </em>
                    </li>
                    <li>
                      Click <strong>Apply to canvas</strong> (or toggle{" "}
                      <strong>Live Sync On</strong>) and hit{" "}
                      <strong>Run</strong>!
                    </li>
                  </ol>
                </div>
                <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                  <a href="#ai-builder">Learn AI Builder Tricks</a>
                </Button>
              </div>

              <div className="flex flex-col justify-between rounded-xl border bg-card p-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                      <Workflow className="size-4" />
                    </span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      Visual Control
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold">
                    Option C: Build Step-by-Step on Canvas
                  </h3>
                  <ol className="list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                    <li>
                      Open the right sidebar → <strong>Toolbar</strong> tab and
                      click nodes to add them to the canvas.
                    </li>
                    <li>
                      Drag from a node&apos;s{" "}
                      <strong className="text-foreground">right handle</strong>{" "}
                      to the next node&apos;s{" "}
                      <strong className="text-foreground">left handle</strong>{" "}
                      to connect them.
                    </li>
                    <li>
                      Click any node to configure its fields in the{" "}
                      <strong>Editor</strong> tab and insert upstream{" "}
                      <code>{"{{ }}"}</code> tokens.
                    </li>
                  </ol>
                </div>
                <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                  <a href="#piping">See How Data Piping Works</a>
                </Button>
              </div>
            </div>
          </section>

          {/* 2. ARCHITECTURE & BI-DIRECTIONAL FLOW */}
          <section id="architecture" className="scroll-mt-20 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                Section 02
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                How Browsevibe Works: Bi-Directional Taste &amp; Web Loops
              </h2>
              <p className="text-sm text-muted-foreground">
                Standard LLMs hallucinate cultural taste, while recommendation
                APIs cannot browse live websites. Browsevibe bridges both in two
                directions:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-5 space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-fuchsia-500/15 px-2.5 py-1 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                  <Sparkles className="size-3.5" />
                  Direction 1: Taste ➔ Live Web Action
                </div>
                <h3 className="text-sm font-semibold">
                  Start with Cultural Taste, Verify &amp; Act on the Live Web
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Resolve favorite artists, films, or authors in{" "}
                  <strong>Qloo Taste Seeds</strong> ➔ get cross-domain venues or
                  brands via <strong>Qloo Recommendations</strong> ➔ launch a{" "}
                  <strong>Stagehand Cloud Browser</strong> to check live menus,
                  reviews, or pricing ➔ send a curated brief via{" "}
                  <strong>Send Email</strong>.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-medium">
                  <span className="rounded bg-background px-2 py-0.5 border">Qloo Taste Seeds</span>
                  <span>→</span>
                  <span className="rounded bg-background px-2 py-0.5 border">Qloo Local / Recommend</span>
                  <span>→</span>
                  <span className="rounded bg-background px-2 py-0.5 border">Open URL &amp; Extract</span>
                  <span>→</span>
                  <span className="rounded bg-background px-2 py-0.5 border">Send Email</span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  <Globe className="size-3.5" />
                  Direction 2: Live Web ➔ Taste Auto-Discovery
                </div>
                <h3 className="text-sm font-semibold">
                  Scrape Any Live Webpage, Auto-Resolve into Qloo Taste Graph
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Open any live URL (e.g., a festival lineup, roster page, or
                  Wikipedia article) with <strong>Open URL</strong> ➔ use{" "}
                  <strong>Stagehand Extract</strong> to pull names ➔ pipe{" "}
                  <code>{"{{ extract.data }}"}</code> directly into{" "}
                  <strong>Qloo Taste Seeds</strong> (which auto-parses JSON and
                  lists) ➔ generate brand matches &amp; an{" "}
                  <strong>AI Sponsorship Pitch</strong>.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-medium">
                  <span className="rounded bg-background px-2 py-0.5 border">Open URL</span>
                  <span>→</span>
                  <span className="rounded bg-background px-2 py-0.5 border">Stagehand Extract</span>
                  <span>→</span>
                  <span className="rounded bg-background px-2 py-0.5 border">Qloo Auto-Resolve</span>
                  <span>→</span>
                  <span className="rounded bg-background px-2 py-0.5 border">AI Synthesizer</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. INTERACTIVE 12-NODE CATALOG */}
          <section id="nodes" className="scroll-mt-20 space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="space-y-1">
                <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                  Section 03
                </span>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Interactive Node Catalog (All 12 Nodes)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Filter by category or search fields and outputs. Click any{" "}
                  <code>{"{{ step.output }}"}</code> chip to copy its output
                  property name.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search nodes, fields, outputs..."
                  className="h-8 w-full rounded-md border bg-background pr-3 pl-8 text-xs outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all", label: "All Nodes (12)" },
                  { id: "qloo", label: "Qloo Taste AI™ (5)" },
                  { id: "browser", label: "Cloud Browser (4)" },
                  { id: "ai-delivery", label: "AI Synthesis & Email (2)" },
                  { id: "trigger", label: "Triggers (2)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setNodeFilter(tab.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    nodeFilter === tab.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Node Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredNodes.map((node) => {
                const Icon = node.icon
                return (
                  <div
                    key={node.type}
                    className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-2xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg",
                              node.accent
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold">
                              {node.label}
                            </h3>
                            <code className="text-[11px] text-muted-foreground">
                              type: &quot;{node.type}&quot;
                            </code>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            node.kind === "trigger"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-violet-500/10 text-violet-500"
                          )}
                        >
                          {node.kind}
                        </span>
                      </div>

                      {/* Inputs */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                          Configurable Fields ({node.fields.length})
                        </p>
                        {node.fields.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground">
                            No inputs required — triggers on manual click.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(
                              new Map(
                                node.fields.map((f) => [f.key, f])
                              ).values()
                            ).map((field) => (
                              <span
                                key={field.key}
                                className="inline-flex items-center gap-1 rounded border bg-muted/40 px-2 py-0.5 text-[11px]"
                              >
                                <span className="font-medium text-foreground">
                                  {field.label}
                                </span>
                                <code className="text-[10px] text-muted-foreground">
                                  ({field.key})
                                </code>
                                {field.required && (
                                  <span className="text-rose-500">*</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Outputs */}
                    <div className="mt-4 border-t pt-3">
                      <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Outputs for Downstream Piping ({node.outputs.length})
                      </p>
                      {node.outputs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Starts execution pipeline.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {node.outputs.map((out) => (
                            <CopyTokenButton
                              key={out.path}
                              token={out.path}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 4. DYNAMIC DATA PIPING */}
          <section id="piping" className="scroll-mt-20 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                Section 04
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Dynamic Data Piping (<code>{"{{ nodeId.outputPath }}"}</code>)
              </h2>
              <p className="text-sm text-muted-foreground">
                Every action node produces structured outputs that downstream
                nodes can reference dynamically. You never have to type raw UUIDs
                by hand!
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="text-sm font-semibold">
                How to Connect &amp; Pipe Data in 3 Steps:
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-violet-500">
                    Step 1 · Wire the Edge
                  </span>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Drag an edge from the upstream node&apos;s right handle to
                    the downstream node&apos;s left handle on the canvas.
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-violet-500">
                    Step 2 · Focus a Target Field
                  </span>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Click the downstream node to open the{" "}
                    <strong>Editor</strong> tab in the right sidebar, then click
                    inside the input or textarea where you want data inserted.
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-violet-500">
                    Step 3 · Click a Connection Chip
                  </span>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Under the{" "}
                    <strong className="text-foreground">Connections</strong>{" "}
                    panel at the bottom of the Editor tab, click any output chip
                    (e.g. <code>Selected entity IDs</code> or{" "}
                    <code>Top pick name</code>) to insert the token automatically.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 text-xs space-y-2">
                <p className="font-semibold text-foreground">
                  Common Piping Patterns:
                </p>
                <ul className="space-y-1.5 text-muted-foreground font-mono text-[11px]">
                  <li>
                    • Stagehand Extract ➔ Qloo Taste Seeds:{" "}
                    <span className="text-foreground">
                      {"{{ <extractNodeId>.data }}"}
                    </span>
                  </li>
                  <li>
                    • Qloo Taste Seeds ➔ Qloo Recommendations:{" "}
                    <span className="text-foreground">
                      {"{{ <seedsNodeId>.entityIds }}"}
                    </span>
                  </li>
                  <li>
                    • Qloo Local Discovery ➔ Open URL:{" "}
                    <span className="text-foreground">
                      {"https://www.google.com/search?q={{ <localNodeId>.searchQuery }}"}
                    </span>
                  </li>
                  <li>
                    • AI Cultural Synthesizer ➔ Send Email Body:{" "}
                    <span className="text-foreground">
                      {"{{ <synthesizeNodeId>.summary }}"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. WISPR FLOW & AI AGENT BUILDER */}
          <section id="ai-builder" className="scroll-mt-20 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                Section 05
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Wispr Flow Voice Studio &amp; Conversational AI Builder
              </h2>
              <p className="text-sm text-muted-foreground">
                Build, edit, and configure workflows hands-free using{" "}
                <strong>Wispr Flow Desktop</strong> on the canvas or chat in the{" "}
                <strong>AI</strong> sidebar tab.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-violet-500" />
                  Floating Wispr Flow Voice Bar (<code>⌘K</code> / <code>Ctrl+K</code>)
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Press <code>⌘K</code> (or click{" "}
                  <strong>Speak with Wispr Flow</strong> at the bottom of the
                  canvas), hold your Wispr Flow Desktop hotkey, and speak any
                  workflow. With <strong>Auto-Build On</strong>, the studio
                  detects when Wispr Flow finishes pasting your dictated sentence
                  and automatically builds &amp; live-syncs the workflow onto the
                  canvas hands-free!
                </p>
              </div>

              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Wand2 className="size-4 text-fuchsia-500" />
                  One-Shot Vibe Dictation &amp; Spoken <code>{"{{ }}"}</code> Tokens
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  In the Node Editor, use the{" "}
                  <strong>Dictate Vibe with Wispr Flow</strong> box to speak one
                  sentence (e.g.{" "}
                  <em>
                    &ldquo;Cozy vinyl bars in Tokyo for fans of Radiohead, avoid
                    tourist traps&rdquo;
                  </em>
                  ) and auto-fill Seeds, Category, City, Vibe Tags, and Exclude
                  fields at once. You can also say{" "}
                  <em>&ldquo;insert entity IDs&rdquo;</em> or{" "}
                  <em>&ldquo;insert top pick name&rdquo;</em> in any field to
                  insert upstream <code>{"{{ }}"}</code> tokens by voice!
                </p>
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="size-4 text-emerald-500" />
                  Live Sync vs. Draft Mode
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Toggle <strong>Live Sync On</strong> in the AI header to apply
                  every AI response directly onto your canvas in real time. Or
                  leave it in <strong>Draft Mode</strong> to inspect{" "}
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">
                    NEW
                  </span>{" "}
                  and{" "}
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                    EDITED
                  </span>{" "}
                  step diffs before clicking <strong>Apply to canvas</strong>.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Wand2 className="size-4 text-violet-500" />
                  Selected-Node Targeting &amp; In-Place Edits
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Click any node on the canvas while using the Wispr Flow Voice
                  Bar or the AI tab. Your spoken or typed instruction is
                  automatically scoped to that node and updates existing nodes in
                  place without creating duplicates.
                </p>
              </div>
            </div>
          </section>

          {/* 6. QLOO TASTE AI GUIDE */}
          <section id="qloo-guide" className="scroll-mt-20 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                Section 06
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Qloo Taste AI™ Deep Dive &amp; Supported Domains
              </h2>
              <p className="text-sm text-muted-foreground">
                Browsevibe supports all 10 official Qloo entity categories plus
                in-editor live entity resolution, mood tags, negative seeds,
                taste overlap, and audience demographics.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/50 text-[11px] font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Domain Label</th>
                    <th className="px-4 py-2.5">Qloo URN</th>
                    <th className="px-4 py-2.5">Example Seeds</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {QLOO_DOMAINS.map((d) => (
                    <tr key={d.urn} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium text-foreground">
                        {d.label}
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px] text-violet-500">
                        {d.urn}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {d.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-4 space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold">
                  <Search className="size-3.5 text-fuchsia-500" />
                  In-Editor &ldquo;Verify in Qloo&rdquo;
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  When editing a <strong>Qloo Taste Seeds</strong> node, click{" "}
                  <strong>Verify in Qloo</strong> inside the right sidebar to
                  test your query live and inspect matched Qloo Entity Names,
                  Domains, and UUIDs before running the workflow.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold">
                  <GitCompareArrows className="size-3.5 text-pink-500" />
                  Taste Overlap (<code>qloo-compare</code>)
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Enter two distinct profiles (e.g., <em>Profile A: Radiohead</em>{" "}
                  vs. <em>Profile B: Daft Punk</em>) to compute a{" "}
                  <strong>Cultural Compatibility % Score</strong> and discover
                  shared bridge venues or brands.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold">
                  <Users className="size-3.5 text-purple-500" />
                  Audience Persona (<code>qloo-demographics</code>)
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Pass any brand, artist, or seed IDs to get age-cohort
                  distributions (<code>24_and_younger</code> through{" "}
                  <code>45_to_54</code>) and gender skew bars inside the Run
                  Console.
                </p>
              </div>
            </div>
          </section>

          {/* 7. LIVE RUN CONSOLE, CLOUD BROWSER & CONSTELLATION */}
          <section id="console" className="scroll-mt-20 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                Section 07
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Live Run Console, Cloud Browser Replay &amp; Taste Constellation
              </h2>
              <p className="text-sm text-muted-foreground">
                The bottom Run Console streams every step in real time via
                Trigger.dev and gives you three specialized visualizers:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MonitorPlay className="size-4 text-emerald-500" />
                  Live Cloud Browser View
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Whenever a workflow runs a browser step (
                  <code>open-url</code>, <code>act</code>, <code>extract</code>,{" "}
                  <code>observe</code>), click the{" "}
                  <strong>Live Browser / Browser Replay</strong> tab in the
                  console (or the pulsing <strong>LIVE VIEW</strong> badge on
                  the active canvas node) to watch the remote Browserbase
                  stealth session live!
                </p>
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-violet-500" />
                  Interactive Taste Constellation
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  On any completed Qloo step, switch between{" "}
                  <strong>List View</strong> and{" "}
                  <strong>Constellation</strong> inside the Qloo Taste Card to
                  explore an interactive SVG radial affinity graph connecting
                  your taste seeds to cross-domain recommendations.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BrainCircuit className="size-4 text-indigo-500" />
                  Executive Brief Viewer
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Outputs from the <strong>AI Cultural Synthesizer</strong>{" "}
                  render in a dedicated executive card featuring the headline,
                  bulleted key takeaways, narrative body, and recommended next
                  action.
                </p>
              </div>
            </div>
          </section>

          {/* 8. STARTER BLUEPRINTS */}
          <section id="templates" className="scroll-mt-20 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                Section 08
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                4 Pre-Built Starter Blueprints
              </h2>
              <p className="text-sm text-muted-foreground">
                Every blueprint can be launched in 1 click from{" "}
                <Link
                  href="/launch"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  /launch
                </Link>{" "}
                or from the right sidebar Toolbar inside any workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  badge: "Flagship 6-Step",
                  title: "Web-to-Taste Auto-Discovery",
                  pipeline:
                    "Start → Open URL (Wikipedia) → Stagehand Extract → Qloo Taste Seeds → Qloo Brand Match → AI Sponsorship Pitch",
                  desc: "Scrapes live cultural entities from a webpage, resolves them into Qloo Taste Seeds automatically, finds aligned lifestyle brands, and writes a sponsorship pitch deck brief.",
                },
                {
                  badge: "Full Agent Pipeline",
                  title: "Autonomous Cultural Concierge",
                  pipeline:
                    "Start → Qloo Taste Seeds → Qloo Local (Tokyo) → Open URL (Live Web Check) → Send VIP Email",
                  desc: "Turns Radiohead & Haruki Murakami into hyper-local Tokyo venue recommendations, verifies the top venue on the live web, and emails a bespoke itinerary.",
                },
                {
                  badge: "Cross-Domain",
                  title: "Brand Affinity Scout",
                  pipeline:
                    "Start → Cinema Aesthetic Seeds → Qloo Brand Recommendations → Send Email Report",
                  desc: "Maps film aesthetics (Wes Anderson, Studio Ghibli) to high-affinity fashion & lifestyle brands for partnership scouting.",
                },
                {
                  badge: "Local Discovery",
                  title: "Local Hotspots Explorer",
                  pipeline:
                    "Start → Favorite Artist Seed → Qloo Local Discovery (New York)",
                  desc: "Fast 3-step pipeline that turns musical taste into explainable dining, coffee, and nightlife picks in any city.",
                },
              ].map((tpl) => (
                <div
                  key={tpl.title}
                  className="flex flex-col justify-between rounded-xl border bg-card p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-500">
                      {tpl.badge}
                    </span>
                    <h3 className="text-sm font-semibold">{tpl.title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {tpl.desc}
                    </p>
                    <div className="rounded-md border bg-muted/40 p-2 font-mono text-[11px] text-foreground">
                      {tpl.pipeline}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/launch">
                      <Play className="size-3.5" />
                      Launch from /launch
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* 9. LOCAL SETUP & ENV */}
          <section id="setup" className="scroll-mt-20 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase">
                Section 09
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Local Setup, Environment Keys &amp; Troubleshooting
              </h2>
              <p className="text-sm text-muted-foreground">
                Running Browsevibe locally requires two processes: the Next.js
                app server and the Trigger.dev background worker.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold">
                    Terminal 1 — Next.js Studio App
                  </p>
                  <pre className="overflow-x-auto rounded-lg border bg-muted/60 p-3 font-mono text-xs">
                    <code>{`npm install\nnpm run db:push\nnpm run dev`}</code>
                  </pre>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold">
                    Terminal 2 — Trigger.dev Durable Worker
                  </p>
                  <pre className="overflow-x-auto rounded-lg border bg-muted/60 p-3 font-mono text-xs">
                    <code>{`npx trigger.dev@latest dev`}</code>
                  </pre>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold">
                  Required Environment Variables (<code>.env</code>)
                </p>
                <pre className="overflow-x-auto rounded-lg border bg-muted/60 p-3.5 font-mono text-[11px] leading-relaxed">
                  <code>{`# Database (Neon Serverless Postgres)
DATABASE_URL="postgresql://..."

# Qloo Taste AI™ API
QLOO_API_KEY="your_qloo_hackathon_api_key"
QLOO_BASE_URL="https://hackathon.api.qloo.com"

# Google Gemini API (AI Builder, Cultural Synthesizer & Stagehand)
GEMINI_API_KEY="AIzaSy..."

# Browserbase & Stagehand v4 (Cloud Stealth Browsers)
BROWSERBASE_API_KEY="bb_live_..."

# Trigger.dev v4 (Background Execution & Realtime Streams)
TRIGGER_SECRET_KEY="tr_dev_..."

# Liveblocks (Multiplayer Canvas & Presence)
LIVEBLOCKS_SECRET_KEY="sk_dev_..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Email Delivery (Resend or Gmail App Password)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Browsevibe <onboarding@resend.dev>"`}</code>
                </pre>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

