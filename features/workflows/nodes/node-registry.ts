import type { Node } from "@xyflow/react"
import {
    Eye,
    FileSearch,
    Globe,
    MousePointer2,
    MousePointerClick,
    type LucideIcon,
} from "lucide-react"

export type StepNodeKind = "trigger" | "action"

// One editable field on a node, rendered as an input in the inspector later.
export type NodeField = {
    key: string
    label: string
    placeholder?: string
    // Render as a multi-line textarea instead of a single-line input.
    multiline?: boolean
    required?: boolean
}

export type NodeOutput = {
    path: string
    label: string
}

// A node type's manifest entry. Add a node by adding an entry to nodeRegistry.
export type NodeDefinition = {
    type: string
    kind: StepNodeKind
    label: string
    icon: LucideIcon
    accent: string // Tailwind classes for the icon chip color
    fields: NodeField[]
    outputs: NodeOutput[]
}

export const nodeRegistry = {
    start: {
        type: "start",
        kind: "trigger",
        label: "Start",
        icon: MousePointerClick,
        accent: "bg-blue-500 text-white",
        fields: [],
        outputs: [],
    },
    "open-url": {
        type: "open-url",
        kind: "action",
        label: "Open URL",
        icon: Globe,
        accent: "bg-emerald-500 text-white",
        fields: [
            { key: "url", label: "URL", placeholder: "https://youtube.com", required: true },
        ],
        outputs: [
            { path: "url", label: "URL" },
            { path: "title", label: "Title" },
        ],
    },
    act: {
        type: "act",
        kind: "action",
        label: "Act",
        icon: MousePointer2,
        accent: "bg-violet-500 text-white",
        fields: [
            {
                key: "instruction",
                label: "Instruction",
                placeholder: "Click the sign in button, then enter the email address",
                multiline: true,
                required: true,
            },
        ],
        outputs: [
            { path: "success", label: "Succeeded" },
            { path: "message", label: "Message" },
            { path: "url", label: "URL" },
        ],
    },
    extract: {
        type: "extract",
        kind: "action",
        label: "Extract",
        icon: FileSearch,
        accent: "bg-amber-500 text-white",
        fields: [
            {
                key: "instruction",
                label: "Instruction",
                placeholder: "Extract the product name and price",
                multiline: true,
                required: true,
            },
        ],
        outputs: [{ path: "data", label: "Extracted data" }],
    },
    observe: {
        type: "observe",
        kind: "action",
        label: "Observe",
        icon: Eye,
        accent: "bg-cyan-500 text-white",
        fields: [
            {
                key: "instruction",
                label: "Instruction",
                placeholder: "Find the sign in button and email field",
                multiline: true,
                required: true,
            },
        ],
        outputs: [{ path: "matches", label: "Matches" }],
    },
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry

// Plain JSON only (synced through Liveblocks later). type keys into the registry;
// kind and title are denormalized so the server can read them without the registry.
export type StepNodeData = {
    type: NodeType
    kind: StepNodeKind
    title: string
    values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, "step">

export type ActionNodeType = {
    [K in NodeType]: (typeof nodeRegistry)[K]["kind"] extends "action" ? K : never
}[NodeType]
