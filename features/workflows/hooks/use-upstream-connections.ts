"use client"

import { useMemo } from "react"
import { useStore } from "@xyflow/react"

import {
    nodeRegistry,
    type NodeType,
    type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

type UpstreamConnection = {
    token: string
    nodeType: NodeType
    label: string
}

/** Returns insertable output tokens for every node upstream of the selection. */
export function useUpstreamConnections(): UpstreamConnection[] {
    const nodes = useStore((state) => state.nodes) as StepNodeType[]
    const edges = useStore((state) => state.edges)

    return useMemo(() => {
        const selectedNode = nodes.find((node) => node.selected)
        if (!selectedNode) return []

        const upstreamIds = new Set<string>()
        const visitUpstream = (targetId: string) => {
            for (const edge of edges) {
                if (
                    edge.target !== targetId ||
                    edge.source === selectedNode.id ||
                    upstreamIds.has(edge.source)
                ) {
                    continue
                }

                upstreamIds.add(edge.source)
                visitUpstream(edge.source)
            }
        }

        visitUpstream(selectedNode.id)

        return nodes
            .filter((node) => upstreamIds.has(node.id))
            .flatMap((node) =>
                nodeRegistry[node.data.type].outputs.map((output) => ({
                    token: `{{ ${node.id}.${output.path} }}`,
                    nodeType: node.data.type,
                    label: `${node.data.title}: ${output.label}`,
                }))
            )
    }, [edges, nodes])
}
