"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import type { Edge } from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"

import type { WorkflowGraph } from "@/lib/db/schema"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"

const defaultInitialNodes: StepNodeType[] = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: { type: "start", kind: "trigger", title: "Start", values: {} },
  },
]

const defaultInitialEdges: Edge[] = []

type LiveblocksFlowReturn = ReturnType<
  typeof useLiveblocksFlow<StepNodeType, Edge>
>

const WorkflowFlowContext = createContext<LiveblocksFlowReturn | null>(null)

export function WorkflowFlowProvider({
  initialGraph,
  children,
}: {
  initialGraph?: WorkflowGraph | null
  children: ReactNode
}) {
  const seedNodes = initialGraph?.nodes?.length
    ? initialGraph.nodes
    : defaultInitialNodes
  const seedEdges = initialGraph?.edges ?? defaultInitialEdges

  const flow = useLiveblocksFlow<StepNodeType, Edge>({
    suspense: true,
    nodes: {
      initial: seedNodes,
    },
    edges: {
      initial: seedEdges,
    },
  })

  // Self-heal rooms that were previously initialized with an empty LiveMap
  // while the database workflow record holds a template or saved graph.
  const didRecoverEmptyRoom = useRef(false)
  useEffect(() => {
    if (didRecoverEmptyRoom.current) return
    if (!flow.isLoading && flow.nodes.length === 0 && seedNodes.length > 0) {
      didRecoverEmptyRoom.current = true
      flow.onNodesChange(
        seedNodes.map((item) => ({ type: "add" as const, item }))
      )
      if (seedEdges.length > 0) {
        flow.onEdgesChange(
          seedEdges.map((item) => ({ type: "add" as const, item }))
        )
      }
    }
  }, [
    flow,
    flow.isLoading,
    flow.nodes.length,
    seedNodes,
    seedEdges,
  ])

  return (
    <WorkflowFlowContext.Provider value={flow}>
      {children}
    </WorkflowFlowContext.Provider>
  )
}

export function useWorkflowFlow(): LiveblocksFlowReturn {
  const ctx = useContext(WorkflowFlowContext)
  if (!ctx) {
    throw new Error(
      "useWorkflowFlow must be used within a WorkflowFlowProvider"
    )
  }
  return ctx
}

