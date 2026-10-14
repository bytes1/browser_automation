import type { Node } from "@xyflow/react"
import {
  Eye,
  FileSearch,
  Globe,
  Mail,
  CalendarClock,
  MousePointer2,
  MousePointerClick,
  MapPin,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export type StepNodeKind = "trigger" | "action"

// One editable field on a node, rendered as an input in the inspector later.
export type NodeField = {
  key: string
  label: string
  placeholder?: string
  inputType?: "time" | "datetime-local"
  // Render as a multi-line textarea instead of a single-line input.
  multiline?: boolean
  required?: boolean
  defaultValue?: string
  options?: { label: string; value: string }[]
  showWhen?: { field: string; value: string }
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
  schedule: {
    type: "schedule",
    kind: "trigger",
    label: "Schedule Trigger",
    icon: CalendarClock,
    accent: "bg-indigo-600 text-white",
    fields: [
      {
        key: "frequency",
        label: "Repeat",
        required: true,
        defaultValue: "daily",
        options: [
          { label: "One time", value: "once" },
          { label: "Every day", value: "daily" },
          { label: "Weekdays", value: "weekdays" },
          { label: "Every week", value: "weekly" },
          { label: "Every month", value: "monthly" },
          { label: "Custom cron", value: "custom" },
        ],
      },
      {
        key: "dateTime",
        label: "Run on",
        inputType: "datetime-local",
        required: true,
        showWhen: { field: "frequency", value: "once" },
      },
      {
        key: "time",
        label: "Run at",
        inputType: "time",
        required: true,
        defaultValue: "09:00",
        showWhen: { field: "frequency", value: "daily" },
      },
      {
        key: "time",
        label: "Run at",
        inputType: "time",
        required: true,
        defaultValue: "09:00",
        showWhen: { field: "frequency", value: "weekdays" },
      },
      {
        key: "time",
        label: "Run at",
        inputType: "time",
        required: true,
        defaultValue: "09:00",
        showWhen: { field: "frequency", value: "weekly" },
      },
      {
        key: "weekday",
        label: "Day of week",
        required: true,
        defaultValue: "1",
        showWhen: { field: "frequency", value: "weekly" },
        options: [
          { label: "Sunday", value: "0" },
          { label: "Monday", value: "1" },
          { label: "Tuesday", value: "2" },
          { label: "Wednesday", value: "3" },
          { label: "Thursday", value: "4" },
          { label: "Friday", value: "5" },
          { label: "Saturday", value: "6" },
        ],
      },
      {
        key: "time",
        label: "Run at",
        inputType: "time",
        required: true,
        defaultValue: "09:00",
        showWhen: { field: "frequency", value: "monthly" },
      },
      {
        key: "monthday",
        label: "Day of month",
        required: true,
        defaultValue: "1",
        showWhen: { field: "frequency", value: "monthly" },
        options: [
          ...Array.from({ length: 31 }, (_, index) => ({
            label: `${index + 1}`,
            value: `${index + 1}`,
          })),
          { label: "Last day", value: "L" },
        ],
      },
      {
        key: "cron",
        label: "Cron pattern",
        placeholder: "0 9 * * 1-5",
        required: true,
        showWhen: { field: "frequency", value: "custom" },
      },
      {
        key: "timezone",
        label: "Timezone",
        placeholder: "Asia/Kolkata",
        required: true,
        defaultValue: "Asia/Kolkata",
      },
    ],
    outputs: [],
  },
  "open-url": {
    type: "open-url",
    kind: "action",
    label: "Open URL",
    icon: Globe,
    accent: "bg-emerald-500 text-white",
    fields: [
      {
        key: "url",
        label: "URL",
        placeholder: "https://youtube.com",
        required: true,
      },
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
  "send-email": {
    type: "send-email",
    kind: "action",
    label: "Send Email",
    icon: Mail,
    accent: "bg-rose-500 text-white",
    fields: [
      {
        key: "provider",
        label: "Send with",
        required: true,
        defaultValue: "resend",
        options: [
          { label: "Resend", value: "resend" },
          { label: "Gmail", value: "gmail" },
        ],
      },
      {
        key: "to",
        label: "Recipient email",
        placeholder: "anyone@example.com",
        required: true,
      },
      {
        key: "subject",
        label: "Subject",
        placeholder: "Email subject",
        required: true,
      },
      {
        key: "body",
        label: "Body",
        placeholder: "Write your email",
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ path: "id", label: "Email ID" }],
  },
  "qloo-search": {
    type: "qloo-search",
    kind: "action",
    label: "Qloo Taste Seeds",
    icon: Search,
    accent: "bg-fuchsia-600 text-white",
    fields: [
      {
        key: "query",
        label: "Favorite(s)",
        placeholder: "Radiohead, Haruki Murakami",
        multiline: true,
        required: true,
      },
      {
        key: "entityType",
        label: "Category",
        required: true,
        defaultValue: "any",
        options: [
          { label: "Any category", value: "any" },
          { label: "Artist / Musician", value: "urn:entity:artist" },
          { label: "Place / Venue / Dining", value: "urn:entity:place" },
          { label: "Movie / Film", value: "urn:entity:movie" },
          { label: "TV Show", value: "urn:entity:tv_show" },
          { label: "Book / Author", value: "urn:entity:book" },
          { label: "Brand / Fashion / Lifestyle", value: "urn:entity:brand" },
          { label: "Podcast", value: "urn:entity:podcast" },
          { label: "Video Game", value: "urn:entity:video_game" },
          { label: "Travel Destination", value: "urn:entity:destination" },
          { label: "Person / Creator", value: "urn:entity:person" },
        ],
      },
    ],
    outputs: [
      { path: "entityIds", label: "Selected entity IDs" },
      { path: "primaryEntityId", label: "Primary entity ID" },
      { path: "primaryName", label: "Primary name" },
      { path: "candidateEntityIds", label: "Candidate entity IDs" },
      { path: "entities", label: "Matched entities" },
      { path: "names", label: "Matched names" },
      { path: "summary", label: "Taste seed summary" },
    ],
  },
  "qloo-recommend": {
    type: "qloo-recommend",
    kind: "action",
    label: "Qloo Recommendations",
    icon: Sparkles,
    accent: "bg-violet-600 text-white",
    fields: [
      {
        key: "entityIds",
        label: "Taste seed IDs",
        placeholder: "Connect Qloo Taste Seeds → Entity IDs",
        required: true,
      },
      {
        key: "targetType",
        label: "Recommend category",
        required: true,
        defaultValue: "urn:entity:place",
        options: [
          { label: "Artist / Musician", value: "urn:entity:artist" },
          { label: "Place / Venue / Dining", value: "urn:entity:place" },
          { label: "Movie / Film", value: "urn:entity:movie" },
          { label: "TV Show", value: "urn:entity:tv_show" },
          { label: "Book / Author", value: "urn:entity:book" },
          { label: "Brand / Fashion / Lifestyle", value: "urn:entity:brand" },
          { label: "Podcast", value: "urn:entity:podcast" },
          { label: "Video Game", value: "urn:entity:video_game" },
          { label: "Travel Destination", value: "urn:entity:destination" },
          { label: "Person / Creator", value: "urn:entity:person" },
        ],
      },
      {
        key: "city",
        label: "City / Location (Optional)",
        placeholder: "Tokyo, New York, or leave empty for global",
      },
      {
        key: "limit",
        label: "Result count",
        placeholder: "8",
        defaultValue: "8",
      },
    ],
    outputs: [
      { path: "entities", label: "Recommendations" },
      { path: "names", label: "Recommendation names" },
      { path: "entityIds", label: "Recommendation IDs" },
      { path: "topPickName", label: "Top pick name" },
      { path: "topPickReason", label: "Top pick explanation" },
      { path: "searchQuery", label: "Web search query" },
      { path: "summary", label: "Formatted recommendations" },
    ],
  },
  "qloo-local": {
    type: "qloo-local",
    kind: "action",
    label: "Qloo Local Discovery",
    icon: MapPin,
    accent: "bg-rose-600 text-white",
    fields: [
      {
        key: "entityIds",
        label: "Taste seed IDs",
        placeholder: "Connect Qloo Taste Seeds → Entity IDs",
        required: true,
      },
      { key: "city", label: "City", placeholder: "New York", required: true },
      {
        key: "limit",
        label: "Result count",
        placeholder: "8",
        defaultValue: "8",
      },
    ],
    outputs: [
      { path: "entities", label: "Local recommendations" },
      { path: "names", label: "Place names" },
      { path: "entityIds", label: "Place IDs" },
      { path: "topPickName", label: "Top pick venue" },
      { path: "topPickReason", label: "Top venue explanation" },
      { path: "searchQuery", label: "Maps search query" },
      { path: "summary", label: "Formatted itinerary summary" },
    ],
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
