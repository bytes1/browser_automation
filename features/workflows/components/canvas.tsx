"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Controls,
  ReactFlow,
  ConnectionLineType,
  type ColorMode,
  type Edge,
  NodeTypes,
  Panel,
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { AvatarStack } from "@liveblocks/react-ui"
import { BookOpenIcon } from "lucide-react"

import type { WorkflowGraph } from "@/lib/db/schema"
import { StepNode } from "@/features/workflows/components/step-node"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

const nodeTypes: NodeTypes = { step: StepNode }

const initialNodes: StepNodeType[] = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: { type: "start", kind: "trigger", title: "Start", values: {} },
  },
]

const initialEdges: Edge[] = []

const emptySubscribe = () => () => {}

// False during server render and hydration, true after mount. Keeps the
// server and initial client render identical to avoid a hydration mismatch.
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

interface CanvasProps {
  initialGraph?: WorkflowGraph | null
}

export function Canvas({ initialGraph }: CanvasProps) {
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
  } = useLiveblocksFlow({
    suspense: true,
    nodes: {
      initial: initialGraph?.nodes?.length ? initialGraph.nodes : initialNodes,
    },
    edges: {
      initial: initialGraph?.edges ?? initialEdges,
    },
  })

  return (
    <div className="size-full">
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
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border)" }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "var(--border)" },
        }}
        style={
          {
            "--xy-background-color": "var(--background)",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as React.CSSProperties
        }
        maxZoom={1}
      >
        <Controls />
        <Cursors />
        <Panel position="top-right" className="flex items-center gap-2">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs backdrop-blur-xs transition-colors hover:border-violet-500/40 hover:bg-accent"
          >
            <BookOpenIcon className="size-3.5 text-violet-500" />
            <span>Docs &amp; Guide</span>
          </Link>
          <AvatarStack />
        </Panel>
      </ReactFlow>
    </div>
  )
}
