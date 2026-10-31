"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ConnectionLineType,
  useReactFlow,
  type ColorMode,
  NodeTypes,
  Panel,
} from "@xyflow/react"
import { Cursors } from "@liveblocks/react-flow"
import { AvatarStack } from "@liveblocks/react-ui"
import {
  BookOpenIcon,
  ChevronDown,
  ExternalLink,
  GitBranch,
  Maximize2,
  Play,
  Sparkles,
} from "lucide-react"

import { StepNode } from "@/features/workflows/components/step-node"
import { WisprVoiceBar } from "@/features/workflows/components/wispr-voice-bar"
import { useWorkflowFlow } from "@/features/workflows/components/workflow-flow-provider"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

const nodeTypes: NodeTypes = { step: StepNode }

const emptySubscribe = () => () => { }

// False during server render and hydration, true after mount. Keeps the
// server and initial client render identical to avoid a hydration mismatch.
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function AutoFitOnHydrate({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow()
  const fittedCountRef = useRef(0)

  useEffect(() => {
    if (nodeCount > 0 && nodeCount !== fittedCountRef.current) {
      const shouldRefit = fittedCountRef.current <= 1
      fittedCountRef.current = nodeCount
      if (shouldRefit) {
        const timer = window.setTimeout(() => {
          void fitView({ padding: 0.16, duration: 250 })
        }, 60)
        return () => window.clearTimeout(timer)
      }
    }
  }, [nodeCount, fitView])

  return null
}

function FitViewQuickButton() {
  const { fitView } = useReactFlow()
  return (
    <button
      type="button"
      onClick={() => fitView({ padding: 0.16, duration: 350 })}
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground"
      title="Fit graph to view"
    >
      <Maximize2 className="size-3 text-violet-500" />
      <span>Fit View</span>
    </button>
  )
}

export function Canvas() {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()
  const colorMode: ColorMode = mounted
    ? (resolvedTheme as ColorMode) ?? "light"
    : "light"
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useWorkflowFlow()

  return (
    <div className="relative size-full overflow-hidden bg-background">
      {/* Subtle studio radial ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(139,92,246,0.08),transparent_70%),radial-gradient(ellipse_55%_45%_at_85%_95%,rgba(16,185,129,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(139,92,246,0.14),transparent_70%),radial-gradient(ellipse_55%_45%_at_85%_95%,rgba(16,185,129,0.09),transparent_70%)]"
      />
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        colorMode={colorMode}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.2}
        maxZoom={1.15}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          stroke: "oklch(0.6 0.18 285)",
          strokeWidth: 2,
        }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: {
            stroke: "var(--muted-foreground)",
            strokeOpacity: 0.45,
            strokeWidth: 2,
          },
        }}
        style={
          {
            "--xy-background-color": "transparent",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as React.CSSProperties
        }
      >
        <AutoFitOnHydrate nodeCount={nodes.length} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.6}
          color={
            colorMode === "dark"
              ? "rgba(148, 163, 184, 0.22)"
              : "rgba(100, 116, 139, 0.26)"
          }
        />
        <Controls className="!rounded-xl !border !border-border/80 !bg-card/90 !shadow-md backdrop-blur-md overflow-hidden [&>button]:!border-border/60 [&>button]:!bg-transparent hover:[&>button]:!bg-accent" />
        <Cursors />

        {/* Top-Left Studio Graph Status Pill */}
        <Panel position="top-left" className="m-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/85 px-3 py-1.5 text-xs shadow-sm backdrop-blur-md">
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
              <Sparkles className="size-3.5 text-violet-500" />
              <span>Workflow Canvas</span>
            </span>
            <span className="h-3.5 w-px bg-border" />
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <GitBranch className="size-3 text-emerald-500" />
              {nodes.length} {nodes.length === 1 ? "node" : "nodes"} · {edges.length}{" "}
              {edges.length === 1 ? "edge" : "edges"}
            </span>
            <FitViewQuickButton />
          </div>
        </Panel>

        {/* Top-Right Docs & Collaborative Presence Capsule */}
        <Panel position="top-right" className="m-3 flex items-center gap-2">
          <details className="group relative">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-border/80 bg-card/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-md [&::-webkit-details-marker]:hidden">
              <Play className="size-3.5 text-violet-500" />
              <span>Getting started</span>
              <ChevronDown className="size-3 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-xl">
              <p className="px-1 pb-2 text-xs font-semibold text-foreground">
                New to workflows? Start with these short videos.
              </p>
              <div className="space-y-1">
                {[
                  {
                    title: "Create a simple workflow",
                    description: "See how to build and run your first workflow.",
                    href: "https://youtu.be/lfbnJCy0jYE",
                  },
                  {
                    title: "Subculture & competitor positioning",
                    description:
                      "See how the template compares audiences and competitors.",
                    href: "https://youtu.be/boBc_m4Oxv4",
                  },
                  {
                    title: "Pass data between nodes",
                    description:
                      "Learn to use one node’s output as another node’s input.",
                    href: "https://youtu.be/Q_O0MVjLk9k",
                  },
                ].map((video) => (
                  <a
                    key={video.href}
                    href={video.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                  >
                    <span className="space-y-0.5">
                      <span className="block text-xs font-medium text-foreground">
                        {video.title}
                      </span>
                      <span className="block text-[11px] leading-relaxed text-muted-foreground">
                        {video.description}
                      </span>
                    </span>
                    <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
              <Link
                href="/docs#videos"
                className="mt-2 block border-t border-border px-2 pt-2 text-xs font-medium text-violet-600 hover:underline dark:text-violet-300"
              >
                Open video guides in Docs
              </Link>
            </div>
          </details>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-md"
          >
            <BookOpenIcon className="size-3.5 text-violet-500" />
            <span>Docs &amp; Guide</span>
          </Link>
          <div className="rounded-full border border-border/80 bg-card/85 px-1.5 py-0.5 shadow-sm backdrop-blur-md">
            <AvatarStack />
          </div>
        </Panel>

        <Panel position="bottom-center" className="mb-3">
          <WisprVoiceBar />
        </Panel>
      </ReactFlow>
    </div>
  )
}
