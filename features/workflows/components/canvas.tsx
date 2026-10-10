"use client"

import { useCallback } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import { useTheme } from "next-themes"

interface CanvasProps {
  workflowId?: string
}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "1. Trigger (Schedule / Manual)" },
    position: { x: 250, y: 25 },
  },
  {
    id: "2",
    data: { label: "2. Open Browser URL" },
    position: { x: 100, y: 140 },
  },
  {
    id: "3",
    data: { label: "3. Extract Page Data" },
    position: { x: 400, y: 140 },
  },
  {
    id: "4",
    type: "output",
    data: { label: "4. Send Notification" },
    position: { x: 250, y: 260 },
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-4", source: "3", target: "4" },
]

export function Canvas({ workflowId }: CanvasProps) {
  const { resolvedTheme } = useTheme()
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  const colorMode = resolvedTheme === "dark" ? "dark" : "light"

  return (
    <div className="size-full min-h-[300px]" data-workflow-id={workflowId}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode={colorMode}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}

export default Canvas
