"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
    Activity,
    Check,
    CheckCircle2,
    CircleAlert,
    Clock3,
    Compass,
    Copy,
    Download,
    ExternalLink,
    Eye,
    Globe,
    Layers,
    MonitorPlay,
    Network,
    Play,
    Radio,
    Sparkles,
    Terminal,
    Timer,
    ZoomIn,
    ZoomOut,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import {
    nodeRegistry,
    type NodeType,
} from "@/features/workflows/nodes/node-registry"
import type {
    BrowserSessionInfo,
    RunStep,
} from "@/features/workflows/tasks/run-workflow"
import {
    getRunBrowserSession,
    getRunSteps,
    useWorkflowRuns,
    type WorkflowRun,
} from "@/features/workflows/components/workflow-runs-provider"

const BROWSER_STEP_TYPES = new Set(["open-url", "act", "extract", "observe"])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms?: number): string {
    if (ms === undefined || ms === null) return "—"
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    const mins = Math.floor(ms / 60000)
    const secs = ((ms % 60000) / 1000).toFixed(1)
    return `${mins}m ${secs}s`
}

function formatRelativeTime(date?: Date | string): string {
    if (!date) return "—"
    try {
        return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
        return String(date)
    }
}

function downloadMarkdownFile(filename: string, markdown: string) {
    if (typeof window === "undefined") return
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
}

function CopyButton({
    text,
    label = "Copy",
    className,
}: {
    text: string
    label?: string
    className?: string
}) {
    const [copied, setCopied] = useState(false)

    const handleCopy = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            if (!navigator?.clipboard) return
            navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success("Copied to clipboard")
            setTimeout(() => setCopied(false), 2000)
        },
        [text]
    )

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                className
            )}
            title={label}
        >
            {copied ? (
                <>
                    <Check className="size-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                </>
            ) : (
                <>
                    <Copy className="size-3" />
                    <span>{label}</span>
                </>
            )}
        </button>
    )
}

function StepIconChip({
    nodeType,
    className,
}: {
    nodeType?: string
    className?: string
}) {
    const def = nodeType ? nodeRegistry[nodeType as NodeType] : undefined
    const Icon = def?.icon ?? Activity
    const accent = def?.accent ?? "bg-muted text-muted-foreground"

    return (
        <span
            className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-sm text-white",
                accent,
                className
            )}
        >
            <Icon className="size-3" />
        </span>
    )
}

function RunStatusBadge({ status }: { status: WorkflowRun["status"] }) {
    if (status === "EXECUTING") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <Spinner className="size-3" />
                Running
            </span>
        )
    }

    if (status === "QUEUED") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <Clock3 className="size-3" />
                Queued
            </span>
        )
    }

    if (status === "COMPLETED") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Success
            </span>
        )
    }

    if (
        status === "FAILED" ||
        status === "SYSTEM_FAILURE" ||
        status === "CRASHED" ||
        status === "TIMED_OUT"
    ) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <CircleAlert className="size-3" />
                Failed
            </span>
        )
    }

    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {status.toLowerCase()}
        </span>
    )
}

function StepStatusBadge({
    status,
    isLive,
}: {
    status: RunStep["status"]
    isLive?: boolean
}) {
    if (status === "running" && isLive) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                <Spinner className="size-2.5" />
                Running
            </span>
        )
    }

    if (status === "done") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-2.5" />
                Done
            </span>
        )
    }

    if (status === "failed") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                <CircleAlert className="size-2.5" />
                Failed
            </span>
        )
    }

    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Clock3 className="size-2.5" />
            Pending
        </span>
    )
}

function FormattedJson({ data }: { data: unknown }) {
    const jsonString = useMemo(() => {
        try {
            return JSON.stringify(data, null, 2)
        } catch {
            return String(data)
        }
    }, [data])

    return (
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground select-text">
            {jsonString}
        </pre>
    )
}

type QlooEntityItem = {
    id: string
    name: string
    type: string
    affinity: number | null
    explanation?: string
}

type QlooOutputData = {
    entities?: QlooEntityItem[]
    names?: string[]
    topPickName?: string
    topPickReason?: string
    summary?: string
    searchQuery?: string
    city?: string | null
    query?: string
    queries?: string[]
    compatibilityScore?: string
    firstProfileSeeds?: string[]
    secondProfileSeeds?: string[]
    topAgeGroup?: string
    topGender?: string
    ageBreakdown?: Record<string, number>
    genderBreakdown?: Record<string, number>
    personaSummary?: string
    targetType?: string
    vibeTags?: string | null
}

type SynthesisOutputData = {
    headline?: string
    keyTakeaways?: string[]
    content?: string
    actionRecommendation?: string
    summary?: string
}

function SynthesisResultCard({ output }: { output: SynthesisOutputData }) {
    const [viewMode, setViewMode] = useState<"visual" | "json">("visual")
    const { headline, keyTakeaways, content, actionRecommendation } = output

    const handleDownloadMd = useCallback(() => {
        const lines = [
            `# ${headline || "AI Cultural & Web Intelligence Brief"}`,
            "",
            ...(Array.isArray(keyTakeaways) && keyTakeaways.length > 0
                ? [
                      "## Key Cultural & Web Takeaways",
                      ...keyTakeaways.map((item) => `- ${item}`),
                      "",
                  ]
                : []),
            ...(content ? ["## Synthesis", content, ""] : []),
            ...(actionRecommendation
                ? ["## Recommended Action", `> ${actionRecommendation}`, ""]
                : []),
        ]
        downloadMarkdownFile("cultural-intelligence-brief.md", lines.join("\n"))
    }, [headline, keyTakeaways, content, actionRecommendation])

    if (viewMode === "json") {
        return (
            <div className="space-y-2">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setViewMode("visual")}
                        className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        ← Switch to Executive Brief
                    </button>
                </div>
                <FormattedJson data={output} />
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="size-3.5" />
                    <span>AI Cultural &amp; Web Intelligence Brief</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadMd}
                        className="inline-flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
                    >
                        <Download className="size-3" />
                        <span>Download .md</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("json")}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                        View Raw JSON
                    </button>
                </div>
            </div>

            <div className="space-y-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3.5">
                {headline && (
                    <div className="text-sm font-bold text-foreground">
                        {headline}
                    </div>
                )}

                {Array.isArray(keyTakeaways) && keyTakeaways.length > 0 && (
                    <div className="space-y-1 rounded-md border border-border/60 bg-background/80 p-2.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Key Cultural &amp; Web Takeaways
                        </div>
                        <ul className="space-y-1 text-xs text-foreground">
                            {keyTakeaways.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-indigo-500">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {content && (
                    <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                        {content}
                    </div>
                )}

                {actionRecommendation && (
                    <div className="flex items-center justify-between gap-2 rounded bg-indigo-500/10 px-2.5 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        <span>Recommended Action: {actionRecommendation}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Interactive Taste Constellation Radial Graph
// ---------------------------------------------------------------------------

type DomainStyle = {
    label: string
    color: string
    glow: string
    badgeBg: string
    badgeText: string
}

function getDomainStyle(rawType?: string): DomainStyle {
    const clean = (rawType ?? "")
        .toLowerCase()
        .replace("urn:entity:", "")
        .trim()

    if (clean.includes("place") || clean.includes("destination") || clean.includes("hotel")) {
        return {
            label: clean.replaceAll("_", " ") || "place",
            color: "#10b981", // emerald-500
            glow: "rgba(16, 185, 129, 0.35)",
            badgeBg: "bg-emerald-500/15 border-emerald-500/30",
            badgeText: "text-emerald-400",
        }
    }
    if (clean.includes("movie") || clean.includes("tv") || clean.includes("film")) {
        return {
            label: clean.replaceAll("_", " ") || "screen",
            color: "#e879f9", // fuchsia-400
            glow: "rgba(232, 121, 249, 0.35)",
            badgeBg: "bg-fuchsia-500/15 border-fuchsia-500/30",
            badgeText: "text-fuchsia-300",
        }
    }
    if (clean.includes("artist") || clean.includes("music") || clean.includes("album") || clean.includes("podcast")) {
        return {
            label: clean.replaceAll("_", " ") || "music",
            color: "#22d3ee", // cyan-400
            glow: "rgba(34, 211, 238, 0.35)",
            badgeBg: "bg-cyan-500/15 border-cyan-500/30",
            badgeText: "text-cyan-300",
        }
    }
    if (clean.includes("brand")) {
        return {
            label: "brand",
            color: "#fbbf24", // amber-400
            glow: "rgba(251, 191, 36, 0.35)",
            badgeBg: "bg-amber-500/15 border-amber-500/30",
            badgeText: "text-amber-300",
        }
    }
    if (clean.includes("book")) {
        return {
            label: "book",
            color: "#a78bfa", // violet-400
            glow: "rgba(167, 139, 250, 0.35)",
            badgeBg: "bg-violet-500/15 border-violet-500/30",
            badgeText: "text-violet-300",
        }
    }
    return {
        label: clean && clean !== "unknown" ? clean.replaceAll("_", " ") : "culture",
        color: "#c084fc", // purple-400
        glow: "rgba(192, 132, 252, 0.35)",
        badgeBg: "bg-purple-500/15 border-purple-500/30",
        badgeText: "text-purple-300",
    }
}

function truncateLabel(text: string, maxLen = 18): string {
    if (text.length <= maxLen) return text
    return `${text.slice(0, maxLen - 1)}…`
}

function TasteConstellationGraph({
    output,
    seedNames,
}: {
    output: QlooOutputData
    seedNames: string[]
}) {
    const rawEntities = useMemo(() => (output.entities ?? []).slice(0, 10), [output.entities])
    const [selectedIdx, setSelectedIdx] = useState<number>(0)
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
    const [showHarmonicWeb, setShowHarmonicWeb] = useState<boolean>(true)
    const [zoom, setZoom] = useState<number>(1)

    const activeIdx = hoveredIdx !== null ? hoveredIdx : selectedIdx
    const isDualCore = Boolean(output.compatibilityScore)

    // Compute radial coordinates around center (320, 200)
    const cx = 320
    const cy = 200

    const nodes = useMemo(() => {
        const count = rawEntities.length
        return rawEntities.map((entity, idx) => {
            // Normalize affinity into [0.55, 0.99] so every node lands cleanly on the orbital rings
            const rawAff =
                entity.affinity !== null && entity.affinity !== undefined
                    ? entity.affinity
                    : Math.max(0.68, 0.94 - idx * 0.04)
            const affinity = Math.min(0.99, Math.max(0.55, rawAff))
            const affinityPct = Math.round(affinity * 100)

            // Higher affinity = closer to the core (inner ring r=74, outer ring r=164)
            const normalizedDist = (1 - affinity) / 0.45 // 0 at 100%, 1 at 55%
            const baseRadius = 74 + Math.min(1, Math.max(0, normalizedDist)) * 88
            // Slight stagger on alternating indices so labels never collide horizontally
            const radius = baseRadius + (idx % 2 === 0 ? -4 : 6)

            // Start at top (-90 deg) and distribute evenly
            const angleRad = -Math.PI / 2 + (idx * 2 * Math.PI) / Math.max(1, count)
            const x = cx + radius * Math.cos(angleRad)
            const y = cy + radius * Math.sin(angleRad)

            const style = getDomainStyle(entity.type)

            return {
                entity,
                idx,
                x,
                y,
                radius,
                angleRad,
                affinityPct,
                style,
            }
        })
    }, [rawEntities])

    const activeNode = nodes[activeIdx] ?? nodes[0]

    const coreLabel = useMemo(() => {
        if (seedNames.length > 0) {
            return seedNames.slice(0, 2).join(" + ")
        }
        if (output.query) return output.query
        if (output.city) return `${output.city} Taste`
        return "Qloo Taste Core"
    }, [seedNames, output.query, output.city])

    const profileALabel = useMemo(() => {
        if (output.firstProfileSeeds && output.firstProfileSeeds.length > 0) {
            return truncateLabel(output.firstProfileSeeds[0], 14)
        }
        return "Profile A"
    }, [output.firstProfileSeeds])

    const profileBLabel = useMemo(() => {
        if (output.secondProfileSeeds && output.secondProfileSeeds.length > 0) {
            return truncateLabel(output.secondProfileSeeds[0], 14)
        }
        return "Profile B"
    }, [output.secondProfileSeeds])

    if (nodes.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                No cultural entities available to plot in the Taste Constellation.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Constellation Canvas Container */}
            <div className="relative overflow-hidden rounded-xl border border-fuchsia-500/30 bg-slate-950 text-slate-100 shadow-lg">
                {/* Top Overlay Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/80 px-3 py-2 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300 border border-fuchsia-500/30">
                            <Compass className="size-3 animate-spin" style={{ animationDuration: "14s" }} />
                            <span>{isDualCore ? "Binary Taste Overlap Map" : "Radial Taste Constellation"}</span>
                        </span>
                        {output.city && (
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-300 border border-emerald-500/30">
                                📍 {output.city}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setShowHarmonicWeb((v) => !v)}
                            className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-medium transition-colors border",
                                showHarmonicWeb
                                    ? "border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-200"
                                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                            )}
                        >
                            Harmonic Mesh {showHarmonicWeb ? "ON" : "OFF"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.max(0.85, +(z - 0.15).toFixed(2)))}
                            className="rounded border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                            title="Zoom Out"
                        >
                            <ZoomOut className="size-3" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.15).toFixed(2)))}
                            className="rounded border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                            title="Zoom In"
                        >
                            <ZoomIn className="size-3" />
                        </button>
                    </div>
                </div>

                {/* Interactive SVG Radial Graph */}
                <div className="relative flex items-center justify-center overflow-hidden">
                    <svg
                        viewBox="0 0 640 400"
                        className="h-[340px] w-full select-none"
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: "center center",
                            transition: "transform 200ms ease-out",
                        }}
                    >
                        <defs>
                            <radialGradient id="coreAura" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#d946ef" stopOpacity="0.32" />
                                <stop offset="55%" stopColor="#6366f1" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                            </radialGradient>
                            <linearGradient id="bridgeBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f472b6" stopOpacity="0.95" />
                                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.95" />
                            </linearGradient>
                        </defs>

                        {/* Ambient Cosmic Aura */}
                        <circle cx={cx} cy={cy} r={185} fill="url(#coreAura)" />

                        {/* Concentric Affinity Orbit Rings */}
                        {[
                            { r: 74, label: "90%+ CORE AFFINITY" },
                            { r: 120, label: "75%+ STRONG BRIDGE" },
                            { r: 164, label: "60%+ DISCOVERY ORBIT" },
                        ].map((ring) => (
                            <g key={ring.r}>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={ring.r}
                                    fill="none"
                                    stroke="rgba(148, 163, 184, 0.16)"
                                    strokeWidth={1}
                                    strokeDasharray="3 5"
                                />
                                <text
                                    x={cx}
                                    y={cy - ring.r + 10}
                                    textAnchor="middle"
                                    className="fill-slate-500 font-mono text-[8px] tracking-widest"
                                >
                                    {ring.label}
                                </text>
                            </g>
                        ))}

                        {/* Axis Crosshairs */}
                        <line
                            x1={cx - 180}
                            y1={cy}
                            x2={cx + 180}
                            y2={cy}
                            stroke="rgba(148, 163, 184, 0.08)"
                            strokeWidth={1}
                        />
                        <line
                            x1={cx}
                            y1={cy - 180}
                            x2={cx}
                            y2={cy + 180}
                            stroke="rgba(148, 163, 184, 0.08)"
                            strokeWidth={1}
                        />

                        {/* Optional Harmonic Mesh Connecting Adjacent Entities */}
                        {showHarmonicWeb &&
                            nodes.length > 2 &&
                            nodes.map((node, i) => {
                                const next = nodes[(i + 1) % nodes.length]
                                const isHighlighted = i === activeIdx || (i + 1) % nodes.length === activeIdx
                                return (
                                    <line
                                        key={`mesh-${node.entity.id || i}`}
                                        x1={node.x}
                                        y1={node.y}
                                        x2={next.x}
                                        y2={next.y}
                                        stroke={isHighlighted ? "rgba(232, 121, 249, 0.4)" : "rgba(148, 163, 184, 0.14)"}
                                        strokeWidth={isHighlighted ? 1.4 : 0.8}
                                        strokeDasharray="2 4"
                                    />
                                )
                            })}

                        {/* Cultural Bridge Spokes from Core(s) to Each Entity */}
                        {nodes.map((node) => {
                            const isSelected = node.idx === activeIdx
                            if (isDualCore) {
                                const coreAx = cx - 44
                                const coreBx = cx + 44
                                return (
                                    <g key={`spoke-${node.entity.id || node.idx}`}>
                                        <line
                                            x1={coreAx}
                                            y1={cy}
                                            x2={node.x}
                                            y2={node.y}
                                            stroke={node.style.color}
                                            strokeOpacity={isSelected ? 0.85 : 0.25}
                                            strokeWidth={isSelected ? 2.2 : 1}
                                            strokeDasharray={isSelected ? "5 3" : undefined}
                                        />
                                        <line
                                            x1={coreBx}
                                            y1={cy}
                                            x2={node.x}
                                            y2={node.y}
                                            stroke="#38bdf8"
                                            strokeOpacity={isSelected ? 0.85 : 0.25}
                                            strokeWidth={isSelected ? 2.2 : 1}
                                            strokeDasharray={isSelected ? "5 3" : undefined}
                                        />
                                    </g>
                                )
                            }

                            return (
                                <line
                                    key={`spoke-${node.entity.id || node.idx}`}
                                    x1={cx}
                                    y1={cy}
                                    x2={node.x}
                                    y2={node.y}
                                    stroke={node.style.color}
                                    strokeOpacity={isSelected ? 0.9 : 0.32}
                                    strokeWidth={isSelected ? 2.5 : 1.2}
                                    strokeDasharray={isSelected ? "6 3" : undefined}
                                />
                            )
                        })}

                        {/* Center Seed Core (Single or Dual Binary Star) */}
                        {isDualCore ? (
                            <g>
                                {/* Compatibility Bridge Connecting Profile A and Profile B */}
                                <line
                                    x1={cx - 44}
                                    y1={cy}
                                    x2={cx + 44}
                                    y2={cy}
                                    stroke="url(#bridgeBeam)"
                                    strokeWidth={3.5}
                                />
                                <rect
                                    x={cx - 24}
                                    y={cy - 10}
                                    width={48}
                                    height={20}
                                    rx={10}
                                    fill="#0f172a"
                                    stroke="#f472b6"
                                    strokeWidth={1.2}
                                />
                                <text
                                    x={cx}
                                    y={cy + 3.5}
                                    textAnchor="middle"
                                    className="fill-pink-300 font-mono text-[9px] font-bold"
                                >
                                    {output.compatibilityScore}
                                </text>

                                {/* Profile A Core */}
                                <circle
                                    cx={cx - 44}
                                    cy={cy}
                                    r={18}
                                    fill="#701a75"
                                    stroke="#f472b6"
                                    strokeWidth={2}
                                />
                                <text
                                    x={cx - 44}
                                    y={cy + 3}
                                    textAnchor="middle"
                                    className="fill-white font-mono text-[8px] font-bold"
                                >
                                    SEED A
                                </text>
                                <text
                                    x={cx - 44}
                                    y={cy + 30}
                                    textAnchor="middle"
                                    className="fill-pink-200 text-[9px] font-semibold"
                                >
                                    {profileALabel}
                                </text>

                                {/* Profile B Core */}
                                <circle
                                    cx={cx + 44}
                                    cy={cy}
                                    r={18}
                                    fill="#0c4a6e"
                                    stroke="#38bdf8"
                                    strokeWidth={2}
                                />
                                <text
                                    x={cx + 44}
                                    y={cy + 3}
                                    textAnchor="middle"
                                    className="fill-white font-mono text-[8px] font-bold"
                                >
                                    SEED B
                                </text>
                                <text
                                    x={cx + 44}
                                    y={cy + 30}
                                    textAnchor="middle"
                                    className="fill-sky-200 text-[9px] font-semibold"
                                >
                                    {profileBLabel}
                                </text>
                            </g>
                        ) : (
                            <g>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={34}
                                    fill="rgba(217, 70, 239, 0.14)"
                                    stroke="rgba(217, 70, 239, 0.45)"
                                    strokeWidth={1.2}
                                />
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={24}
                                    fill="#3b0764"
                                    stroke="#e879f9"
                                    strokeWidth={2}
                                />
                                <text
                                    x={cx}
                                    y={cy - 2}
                                    textAnchor="middle"
                                    className="fill-fuchsia-200 font-mono text-[8px] font-bold uppercase tracking-wider"
                                >
                                    TASTE CORE
                                </text>
                                <text
                                    x={cx}
                                    y={cy + 9}
                                    textAnchor="middle"
                                    className="fill-white text-[9px] font-semibold"
                                >
                                    {truncateLabel(coreLabel, 14)}
                                </text>
                            </g>
                        )}

                        {/* Orbiting Cultural Entity Nodes */}
                        {nodes.map((node) => {
                            const isSelected = node.idx === activeIdx
                            const isTopPick = node.idx === 0
                            const nodeR = isSelected ? 15 : isTopPick ? 13 : 11
                            const labelOnLeft = Math.cos(node.angleRad) < -0.15
                            const labelOnRight = Math.cos(node.angleRad) > 0.15
                            const textAnchor = labelOnLeft
                                ? "end"
                                : labelOnRight
                                  ? "start"
                                  : "middle"
                            const labelX = labelOnLeft
                                ? node.x - nodeR - 7
                                : labelOnRight
                                  ? node.x + nodeR + 7
                                  : node.x
                            const labelY =
                                !labelOnLeft && !labelOnRight
                                    ? Math.sin(node.angleRad) < 0
                                        ? node.y - nodeR - 10
                                        : node.y + nodeR + 14
                                    : node.y + 3

                            return (
                                <g
                                    key={node.entity.id || node.idx}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedIdx(node.idx)}
                                    onMouseEnter={() => setHoveredIdx(node.idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                >
                                    {/* Outer Selection Reticle */}
                                    {isSelected && (
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={nodeR + 6}
                                            fill="none"
                                            stroke={node.style.color}
                                            strokeWidth={1.5}
                                            strokeDasharray="3 2"
                                        />
                                    )}

                                    {/* Node Glow */}
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r={nodeR + 3}
                                        fill={node.style.glow}
                                    />

                                    {/* Node Core Circle */}
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r={nodeR}
                                        fill="#0f172a"
                                        stroke={node.style.color}
                                        strokeWidth={isSelected ? 2.5 : 1.8}
                                    />

                                    {/* Affinity % inside Node */}
                                    <text
                                        x={node.x}
                                        y={node.y + 3}
                                        textAnchor="middle"
                                        className="fill-white font-mono text-[8.5px] font-bold"
                                    >
                                        {node.affinityPct}%
                                    </text>

                                    {/* Entity Name Label */}
                                    <text
                                        x={labelX}
                                        y={labelY}
                                        textAnchor={textAnchor}
                                        className={cn(
                                            "text-[10.5px] font-semibold transition-colors",
                                            isSelected ? "fill-white font-bold" : "fill-slate-300"
                                        )}
                                    >
                                        {isTopPick ? `★ ${truncateLabel(node.entity.name, 20)}` : truncateLabel(node.entity.name, 18)}
                                    </text>
                                </g>
                            )
                        })}
                    </svg>
                </div>

                {/* Bottom Legend Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-900/90 px-3 py-1.5 text-[10px] text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-emerald-400" />
                            <span>Place / Dining</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-fuchsia-400" />
                            <span>Film / TV</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-cyan-400" />
                            <span>Music / Artist</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-amber-400" />
                            <span>Brand</span>
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                        Click any star node to inspect its Qloo Cultural Bridge X-Ray
                    </span>
                </div>
            </div>

            {/* Cultural Bridge X-Ray Inspector Dock for Selected Constellation Node */}
            {activeNode && (
                <div className="rounded-xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/10 via-violet-500/5 to-transparent p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex items-center gap-1 rounded bg-fuchsia-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-fuchsia-600 dark:text-fuchsia-300">
                                {activeNode.idx === 0 ? "★ #1 Top Match" : `#${activeNode.idx + 1} Constellation Node`}
                            </span>
                            <span
                                className={cn(
                                    "rounded border px-2 py-0.5 text-[10px] font-semibold uppercase",
                                    activeNode.style.badgeBg,
                                    activeNode.style.badgeText
                                )}
                            >
                                {activeNode.style.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-fuchsia-600 dark:text-fuchsia-300">
                                {activeNode.affinityPct}% Qloo Affinity
                            </span>
                            <CopyButton
                                text={`${activeNode.entity.name}${output.city ? ` ${output.city}` : ""} reviews official guide`}
                                label="Copy Browser Query"
                            />
                        </div>
                    </div>

                    <div className="text-sm font-bold text-foreground">
                        {activeNode.entity.name}
                    </div>

                    {/* Visual Cultural Bridge Vector Path */}
                    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border/70 bg-background/80 px-2.5 py-1.5 font-mono text-[11px]">
                        <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                            [{isDualCore ? `${profileALabel} ∩ ${profileBLabel}` : coreLabel}]
                        </span>
                        <span className="text-muted-foreground">
                            ──({activeNode.affinityPct}% taste vector)──►
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            [{activeNode.entity.name}]
                        </span>
                    </div>

                    {activeNode.entity.explanation && (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            <strong className="text-foreground">Cultural Bridge X-Ray:</strong>{" "}
                            {activeNode.entity.explanation}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

function QlooTasteCard({
    output,
    allSteps,
}: {
    output: QlooOutputData
    allSteps?: RunStep[]
}) {
    const [viewMode, setViewMode] = useState<"visual" | "constellation" | "json">("visual")
    const {
        topPickName,
        topPickReason,
        entities,
        searchQuery,
        summary,
        city,
        compatibilityScore,
        topAgeGroup,
        topGender,
        ageBreakdown,
        personaSummary,
    } = output

    const hasConstellationEntities = Array.isArray(entities) && entities.length > 0

    // Discover seed names from this step or any upstream qloo-search step in the same run
    const resolvedSeedNames = useMemo(() => {
        if (Array.isArray(output.queries) && output.queries.length > 0) {
            return output.queries
        }
        if (output.query) {
            return [output.query]
        }
        if (allSteps && allSteps.length > 0) {
            for (const s of allSteps) {
                if (
                    s.nodeType === "qloo-search" &&
                    s.output &&
                    typeof s.output === "object" &&
                    Array.isArray((s.output as { names?: string[] }).names)
                ) {
                    return (s.output as { names: string[] }).names
                }
            }
        }
        return []
    }, [output.queries, output.query, allSteps])

    const handleDownloadMd = useCallback(() => {
        const lines = [
            `# Qloo Taste AI™ Cultural Intelligence Report`,
            "",
            ...(topPickName
                ? [
                      `## Top Cultural Match: ${topPickName}${city ? ` (${city})` : ""}`,
                      topPickReason || "",
                      "",
                  ]
                : []),
            ...(compatibilityScore
                ? [`**Taste Overlap Score:** ${compatibilityScore}`, ""]
                : []),
            ...(personaSummary
                ? ["## Audience Persona Cohort", personaSummary, ""]
                : []),
            ...(Array.isArray(entities) && entities.length > 0
                ? [
                      "## Ranked Cultural Entities",
                      ...entities.map((e, idx) => {
                          const pct =
                              e.affinity !== null && e.affinity !== undefined
                                  ? ` (${Math.round(e.affinity * 100)}% affinity)`
                                  : ""
                          return `${idx + 1}. **${e.name}**${pct}${e.explanation ? ` — ${e.explanation}` : ""}`
                      }),
                      "",
                  ]
                : []),
        ]
        downloadMarkdownFile("qloo-taste-report.md", lines.join("\n"))
    }, [topPickName, city, topPickReason, compatibilityScore, personaSummary, entities])

    return (
        <div className="space-y-3">
            {/* Header & 3-Way View Mode Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                    <Sparkles className="size-3.5" />
                    <span>Qloo Taste Intelligence Insights</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-md border border-border bg-muted/50 p-0.5 text-[11px]">
                        <button
                            type="button"
                            onClick={() => setViewMode("visual")}
                            className={cn(
                                "rounded px-2 py-0.5 font-medium transition-colors",
                                viewMode === "visual"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Cards
                        </button>
                        {hasConstellationEntities && (
                            <button
                                type="button"
                                onClick={() => setViewMode("constellation")}
                                className={cn(
                                    "inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors",
                                    viewMode === "constellation"
                                        ? "bg-fuchsia-600 text-white shadow-2xs"
                                        : "text-fuchsia-600 hover:text-fuchsia-500 dark:text-fuchsia-400"
                                )}
                            >
                                <Network className="size-3" />
                                <span>Constellation</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setViewMode("json")}
                            className={cn(
                                "rounded px-2 py-0.5 font-medium transition-colors",
                                viewMode === "json"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            JSON
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleDownloadMd}
                        className="inline-flex items-center gap-1 rounded border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] font-medium text-fuchsia-600 transition-colors hover:bg-fuchsia-500/20 dark:text-fuchsia-300"
                    >
                        <Download className="size-3" />
                        <span>Download .md</span>
                    </button>
                </div>
            </div>

            {viewMode === "json" ? (
                <FormattedJson data={output} />
            ) : viewMode === "constellation" && hasConstellationEntities ? (
                <TasteConstellationGraph
                    output={output}
                    seedNames={resolvedSeedNames}
                />
            ) : (
                <>
                    {compatibilityScore && (
                        <div className="flex items-center justify-between rounded-lg border border-pink-500/30 bg-pink-500/10 px-3.5 py-2.5">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-300">
                                    Taste Overlap Score
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Cross-profile cultural bridge compatibility
                                </div>
                            </div>
                            <span className="font-mono text-lg font-bold text-pink-600 dark:text-pink-300">
                                {compatibilityScore}
                            </span>
                        </div>
                    )}

                    {ageBreakdown && (
                        <div className="space-y-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                    👥 Audience Persona Cohort
                                </span>
                                {topAgeGroup && (
                                    <span className="font-mono text-xs font-semibold text-purple-700 dark:text-purple-300">
                                        {topAgeGroup} · {topGender}
                                    </span>
                                )}
                            </div>
                            {personaSummary && (
                                <p className="text-xs text-muted-foreground">
                                    {personaSummary}
                                </p>
                            )}
                            <div className="space-y-1.5 pt-1">
                                {Object.entries(ageBreakdown).map(([cohort, ratio]) => {
                                    const pct = Math.min(100, Math.max(4, Math.round(ratio * 100)))
                                    return (
                                        <div key={cohort} className="space-y-0.5">
                                            <div className="flex justify-between text-[11px]">
                                                <span className="capitalize text-muted-foreground">
                                                    {cohort.replaceAll("_", " ")}
                                                </span>
                                                <span className="font-mono font-medium text-foreground">
                                                    {pct}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/70">
                                                <div
                                                    className="h-full rounded-full bg-purple-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {topPickName && (
                        <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 rounded bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
                                    ⭐ Top Cultural Match {city ? `in ${city}` : ""}
                                </span>
                                {entities?.[0]?.affinity !== null && entities?.[0]?.affinity !== undefined && (
                                    <span className="font-mono text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300">
                                        {Math.round(entities[0].affinity * 100)}% Affinity
                                    </span>
                                )}
                            </div>
                            <div className="text-sm font-bold text-foreground">
                                {topPickName}
                            </div>
                            {topPickReason && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {topPickReason}
                                </p>
                            )}
                            {searchQuery && (
                                <div className="rounded bg-background/70 p-2 text-[11px] font-mono text-muted-foreground flex items-center justify-between gap-2 border border-border/50">
                                    <span className="truncate">Browser Query: {searchQuery}</span>
                                    <CopyButton text={searchQuery} label="Copy Query" />
                                </div>
                            )}
                        </div>
                    )}

                    {hasConstellationEntities && (
                        <div className="rounded-md border border-border bg-card p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Matched Cultural Entities ({entities.length})
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("constellation")}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-600 hover:underline dark:text-fuchsia-400"
                                >
                                    <Network className="size-3" />
                                    <span>Explore in Radial Constellation →</span>
                                </button>
                            </div>
                            <div className="divide-y divide-border/60">
                                {entities.slice(0, 6).map((entity, i) => {
                                    const pct =
                                        entity.affinity !== null && entity.affinity !== undefined
                                            ? Math.min(100, Math.max(10, Math.round(entity.affinity * 100)))
                                            : null
                                    const cleanType = entity.type
                                        ?.replace("urn:entity:", "")
                                        .replaceAll("_", " ")

                                    return (
                                        <div key={entity.id || i} className="py-2 first:pt-0 last:pb-0 space-y-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex items-center gap-1.5">
                                                    <span className="text-xs font-medium text-foreground truncate">
                                                        {i + 1}. {entity.name}
                                                    </span>
                                                    {cleanType && cleanType !== "unknown" && (
                                                        <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] uppercase text-muted-foreground">
                                                            {cleanType}
                                                        </span>
                                                    )}
                                                </div>
                                                {pct !== null && (
                                                    <span className="shrink-0 rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                                                        {pct}%
                                                    </span>
                                                )}
                                            </div>
                                            {entity.explanation && (
                                                <div className="text-[11px] text-muted-foreground truncate">
                                                    {entity.explanation}
                                                </div>
                                            )}
                                            {pct !== null && (
                                                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {summary && (!entities || entities.length === 0) && !ageBreakdown && (
                        <div className="rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-foreground whitespace-pre-wrap">
                            {summary}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Live Cloud Browser & Session Replay Panel
// ---------------------------------------------------------------------------

function CloudBrowserPanel({
    browserSession,
    steps,
    isLive,
    onSelectStep,
}: {
    browserSession?: BrowserSessionInfo
    steps: RunStep[]
    isLive: boolean
    onSelectStep: (index: number) => void
}) {
    const [streamMode, setStreamMode] = useState<"fullscreen" | "devtools" | "summary">("fullscreen")

    const browserSteps = useMemo(
        () =>
            steps
                .map((s, index) => ({ step: s, index }))
                .filter(({ step }) => BROWSER_STEP_TYPES.has(step.nodeType)),
        [steps]
    )

    const isSessionLive = isLive && browserSession?.status === "live"
    const liveEmbedUrl =
        streamMode === "devtools"
            ? browserSession?.debuggerUrl || browserSession?.debuggerFullscreenUrl
            : browserSession?.debuggerFullscreenUrl || browserSession?.debuggerUrl

    // Automatically show live stream while session is live, or summary/replay when finished
    const effectiveMode =
        streamMode === "summary"
            ? "summary"
            : isSessionLive && liveEmbedUrl
              ? streamMode
              : liveEmbedUrl && streamMode !== "fullscreen"
                ? streamMode
                : isSessionLive
                  ? "fullscreen"
                  : "summary"

    if (!browserSession) {
        return (
            <div className="flex size-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <div className="mb-2.5 flex size-10 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <Globe className="size-5 text-muted-foreground/70" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                    {isLive
                        ? "Waiting for Cloud Browser session to launch..."
                        : "No Cloud Browser session in this run"}
                </p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    {isLive
                        ? "Browserbase provisions a headless Chromium session as soon as the first Open URL, Act, Extract, or Observe node begins."
                        : "Runs that execute only Qloo Taste AI™ or AI Synthesize nodes complete without provisioning a browser session."}
                </p>
            </div>
        )
    }

    return (
        <div className="flex size-full flex-col overflow-hidden bg-background">
            {/* Browser Chrome Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/90 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Window Dots */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <span className="size-2.5 rounded-full bg-rose-500/80" />
                        <span className="size-2.5 rounded-full bg-amber-500/80" />
                        <span className="size-2.5 rounded-full bg-emerald-500/80" />
                    </div>

                    {/* Status Pill */}
                    {isSessionLive ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Live Stream
                        </span>
                    ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            <MonitorPlay className="size-3" />
                            Session Replay
                        </span>
                    )}

                    {/* Address Bar */}
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border/80 bg-muted/50 px-2.5 py-1 text-xs">
                        <Globe className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate font-mono text-[11px] text-foreground">
                            {browserSession.currentUrl || `browserbase://session/${browserSession.sessionId}`}
                        </span>
                        {browserSession.currentTitle && (
                            <span className="hidden md:inline truncate text-[11px] text-muted-foreground border-l border-border pl-2">
                                {browserSession.currentTitle}
                            </span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {liveEmbedUrl && (
                        <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-[11px]">
                            <button
                                type="button"
                                onClick={() => setStreamMode("fullscreen")}
                                className={cn(
                                    "rounded px-2 py-0.5 font-medium transition-colors",
                                    effectiveMode === "fullscreen"
                                        ? "bg-background text-foreground shadow-2xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Viewport
                            </button>
                            {browserSession.debuggerUrl && (
                                <button
                                    type="button"
                                    onClick={() => setStreamMode("devtools")}
                                    className={cn(
                                        "rounded px-2 py-0.5 font-medium transition-colors",
                                        effectiveMode === "devtools"
                                            ? "bg-background text-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    DevTools
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setStreamMode("summary")}
                                className={cn(
                                    "rounded px-2 py-0.5 font-medium transition-colors",
                                    effectiveMode === "summary"
                                        ? "bg-background text-foreground shadow-2xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Timeline
                            </button>
                        </div>
                    )}

                    <a
                        href={browserSession.sessionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400"
                    >
                        <span>Replay in Browserbase</span>
                        <ExternalLink className="size-3" />
                    </a>
                </div>
            </div>

            {/* Viewport or Session Replay Summary */}
            {effectiveMode !== "summary" && liveEmbedUrl ? (
                <div className="relative flex-1 bg-black">
                    <iframe
                        key={liveEmbedUrl}
                        src={liveEmbedUrl}
                        title="Browserbase Live Cloud Browser"
                        className="size-full border-0"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                        allow="clipboard-read; clipboard-write"
                    />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Session Hero Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-500/25 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-4">
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-blue-600 dark:text-blue-300">
                                    Browserbase Cloud Chromium
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                    ID: {browserSession.sessionId}
                                </span>
                                <CopyButton text={browserSession.sessionId} label="Copy ID" />
                            </div>
                            <h4 className="text-sm font-bold text-foreground truncate">
                                {browserSession.currentTitle || "Recorded Cloud Browser Automation Session"}
                            </h4>
                            {browserSession.currentUrl && (
                                <p className="truncate font-mono text-xs text-muted-foreground">
                                    Final Page: {browserSession.currentUrl}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {liveEmbedUrl && (
                                <button
                                    type="button"
                                    onClick={() => setStreamMode("devtools")}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                                >
                                    <Eye className="size-3.5 text-blue-500" />
                                    <span>Open Live Viewport</span>
                                </button>
                            )}
                            <a
                                href={browserSession.sessionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-500"
                            >
                                <MonitorPlay className="size-3.5" />
                                <span>Launch Full Session Replay</span>
                                <ExternalLink className="size-3" />
                            </a>
                        </div>
                    </div>

                    {/* Browser Actions Timeline */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Executed Browser Actions ({browserSteps.length})
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                Click any action to inspect extracted DOM data
                            </span>
                        </div>

                        <div className="divide-y divide-border/60 rounded-lg border border-border bg-card">
                            {browserSteps.map(({ step, index }) => (
                                <button
                                    key={step.nodeId || index}
                                    type="button"
                                    onClick={() => onSelectStep(index)}
                                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-accent/50"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <StepIconChip nodeType={step.nodeType} />
                                        <div className="min-w-0">
                                            <div className="font-medium text-foreground truncate">
                                                {step.title}
                                            </div>
                                            <div className="font-mono text-[10px] text-muted-foreground">
                                                Stagehand {step.nodeType}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {step.durationMs !== undefined && (
                                            <span className="font-mono text-[11px] text-muted-foreground">
                                                {formatDuration(step.durationMs)}
                                            </span>
                                        )}
                                        <StepStatusBadge status={step.status} isLive={isLive} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Step Details Panel
// ---------------------------------------------------------------------------

function StepDetailsPanel({
    step,
    allSteps,
    isLive,
    runError,
    browserSession,
    onOpenBrowserView,
}: {
    step?: RunStep
    allSteps?: RunStep[]
    isLive: boolean
    runError?: { message?: string }
    browserSession?: BrowserSessionInfo
    onOpenBrowserView?: () => void
}) {
    if (!step) {
        return (
            <div className="flex size-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Layers className="size-8 stroke-[1.5] text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">No step selected</p>
                <p className="text-xs text-muted-foreground">
                    Select a step from the list on the left to inspect its output and error.
                </p>
            </div>
        )
    }

    const { title, nodeType, status, durationMs, output, error, nodeId } = step
    const hasOutput = output !== undefined && output !== null
    const hasError = !!error || status === "failed"
    const isBrowserStep = Boolean(nodeType && BROWSER_STEP_TYPES.has(nodeType))
    const isQlooStep =
        nodeType?.startsWith("qloo") ||
        (typeof output === "object" &&
            output !== null &&
            ("entities" in output ||
                "topPickName" in output ||
                "ageBreakdown" in output))
    const isSynthesisStep =
        nodeType === "ai-synthesize" ||
        (typeof output === "object" &&
            output !== null &&
            "headline" in output &&
            "keyTakeaways" in output)

    return (
        <div className="flex size-full flex-col overflow-y-auto">
            {/* Step Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/60 px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                    <StepIconChip nodeType={nodeType} className="size-6" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-foreground">
                                {title || `Node ${nodeId}`}
                            </h3>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {nodeType}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 rounded bg-muted/70 px-2 py-0.5 text-xs text-muted-foreground">
                        <Timer className="size-3" />
                        <span className="font-mono font-medium text-foreground">
                            {formatDuration(durationMs)}
                        </span>
                    </div>
                    <StepStatusBadge status={status} isLive={isLive} />
                </div>
            </div>

            {/* Step Body */}
            <div className="flex-1 space-y-4 p-4 min-w-0">
                {/* Cloud Browser Session Banner for Browser Steps */}
                {isBrowserStep && browserSession && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                <Globe className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                    <span>Browserbase Cloud Session</span>
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                        ({browserSession.sessionId.slice(0, 8)}…)
                                    </span>
                                </div>
                                <div className="truncate font-mono text-[11px] text-muted-foreground">
                                    {browserSession.currentUrl || browserSession.sessionUrl}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {onOpenBrowserView && (
                                <button
                                    type="button"
                                    onClick={onOpenBrowserView}
                                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-blue-500"
                                >
                                    <MonitorPlay className="size-3" />
                                    <span>
                                        {isLive && browserSession.status === "live"
                                            ? "Watch Live Browser"
                                            : "View Session Replay"}
                                    </span>
                                </button>
                            )}
                            <a
                                href={browserSession.sessionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                                title="Open in Browserbase"
                            >
                                <ExternalLink className="size-3" />
                            </a>
                        </div>
                    </div>
                )}

                {/* Error Box if Failed */}
                {hasError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-destructive">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <CircleAlert className="size-4" />
                                <span>Execution Error</span>
                            </div>
                            {error && <CopyButton text={error} label="Copy Error" />}
                        </div>
                        <pre className="whitespace-pre-wrap break-words rounded bg-destructive/10 p-2 font-mono text-xs leading-relaxed select-text">
                            {error || runError?.message || "Step failed without an explicit error message."}
                        </pre>
                    </div>
                )}

                {/* Output Box */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Produced Output
                        </span>
                        {hasOutput && (
                            <CopyButton
                                text={
                                    typeof output === "object"
                                        ? JSON.stringify(output, null, 2)
                                        : String(output)
                                }
                                label="Copy Output"
                            />
                        )}
                    </div>

                    {hasOutput ? (
                        isQlooStep ? (
                            <QlooTasteCard
                                output={output as QlooOutputData}
                                allSteps={allSteps}
                            />
                        ) : isSynthesisStep ? (
                            <SynthesisResultCard output={output as SynthesisOutputData} />
                        ) : (
                            <FormattedJson data={output} />
                        )
                    ) : (
                        <div className="rounded-md border border-dashed border-border/80 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                            {status === "running" && isLive ? (
                                <div className="flex items-center justify-center gap-2 text-blue-500">
                                    <Spinner className="size-3.5" />
                                    <span>Step is executing in realtime...</span>
                                </div>
                            ) : status === "pending" ? (
                                <span>This step is pending execution.</span>
                            ) : status === "failed" ? (
                                <span>No output was produced because this step failed.</span>
                            ) : (
                                <span>This step completed with no output.</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Node Metadata Footer */}
                <div className="border-t border-border pt-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span>
                            Node ID: <code className="font-mono text-foreground">{nodeId}</code>
                        </span>
                        {durationMs !== undefined && (
                            <span>
                                Execution time:{" "}
                                <code className="font-mono text-foreground">{durationMs}ms</code>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main WorkflowConsole Component
// ---------------------------------------------------------------------------

export function WorkflowConsole({ workflowId }: { workflowId: string }) {
    const { runs, activeRun } = useWorkflowRuns()
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
    const [rightPaneMode, setRightPaneMode] = useState<"step" | "browser">("step")

    // Automatically follow along with live active runs
    useEffect(() => {
        if (activeRun?.id) {
            setSelectedRunId(activeRun.id)
        }
    }, [activeRun?.id])

    // Find the currently selected run, defaulting to the latest run
    const selectedRun = useMemo<WorkflowRun | undefined>(() => {
        if (!runs || runs.length === 0) return undefined
        if (selectedRunId) {
            const found = runs.find((r) => r.id === selectedRunId)
            if (found) return found
        }
        return runs[0]
    }, [runs, selectedRunId])

    const steps = useMemo(() => {
        if (!selectedRun) return []
        return getRunSteps(selectedRun)
    }, [selectedRun])

    const browserSession = useMemo(() => {
        if (!selectedRun) return undefined
        return getRunBrowserSession(selectedRun)
    }, [selectedRun])

    const isLive = selectedRun?.status === "EXECUTING" || selectedRun?.status === "QUEUED"

    // When run changes, auto-select the most relevant step (failed, running, or first)
    const effectiveStepIndex = useMemo(() => {
        if (steps.length === 0) return -1
        if (
            selectedStepIndex !== null &&
            selectedStepIndex >= 0 &&
            selectedStepIndex < steps.length
        ) {
            return selectedStepIndex
        }

        const failedIdx = steps.findIndex((s) => s.status === "failed")
        if (failedIdx !== -1) return failedIdx

        const runningIdx = steps.findIndex((s) => s.status === "running")
        if (runningIdx !== -1) return runningIdx

        return 0
    }, [steps, selectedStepIndex])

    const selectedStep = steps[effectiveStepIndex]

    if (runs.length === 0) {
        return (
            <div className="flex size-full flex-col bg-background">
                <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-card px-3 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <Terminal className="size-3.5 text-muted-foreground" />
                        <span>Console</span>
                    </div>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40 mb-2">
                        <Play className="size-4 text-muted-foreground/70" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No workflow runs yet</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Trigger a run from the toolbar above to see real-time execution steps,
                        live cloud browser stream, Qloo cultural insights, and timing details.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex size-full flex-col bg-background">
            {/* Console Header Bar */}
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-card px-3 text-xs font-semibold">
                <div className="flex items-center gap-2">
                    <Terminal className="size-3.5 text-primary" />
                    <span>Console</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {runs.length} {runs.length === 1 ? "run" : "runs"}
                    </span>
                    {runs.some((r) => r.status === "EXECUTING") && (
                        <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                            <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
                            Live
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Inspector vs Live Cloud Browser Switcher */}
                    <div className="inline-flex items-center rounded-md border border-border bg-muted/50 p-0.5 text-[11px]">
                        <button
                            type="button"
                            onClick={() => setRightPaneMode("step")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium transition-colors",
                                rightPaneMode === "step"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Layers className="size-3" />
                            <span>Step Output</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRightPaneMode("browser")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium transition-colors",
                                rightPaneMode === "browser"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isLive && browserSession?.status === "live" ? (
                                <Radio className="size-3 animate-pulse text-emerald-500" />
                            ) : (
                                <Globe className="size-3 text-blue-500" />
                            )}
                            <span>Cloud Browser</span>
                            {browserSession && (
                                <span
                                    className={cn(
                                        "rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase",
                                        isLive && browserSession.status === "live"
                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                            : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                    )}
                                >
                                    {isLive && browserSession.status === "live" ? "Live" : "Replay"}
                                </span>
                            )}
                        </button>
                    </div>

                    {selectedRun && (
                        <div className="hidden md:flex items-center gap-3 text-muted-foreground text-xs font-normal">
                            <span>
                                Run ID:{" "}
                                <code className="font-mono text-foreground">
                                    {selectedRun.id.slice(0, 10)}…
                                </code>
                            </span>
                            <span>
                                Total:{" "}
                                <span className="font-mono font-medium text-foreground">
                                    {formatDuration(selectedRun.durationMs)}
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Console 3-Column Split */}
            <div className="flex min-h-0 flex-1 divide-x divide-border">
                {/* Column 1: Runs List */}
                <div className="flex w-60 shrink-0 flex-col min-h-0 bg-muted/15">
                    <div className="flex h-8 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>Runs</span>
                        <span>{runs.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                        {runs.map((run, idx) => {
                            const isSelected = selectedRun?.id === run.id
                            const runSteps = getRunSteps(run)
                            const runBrowser = getRunBrowserSession(run)
                            const runNum = runs.length - idx

                            return (
                                <button
                                    key={run.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedRunId(run.id)
                                        setSelectedStepIndex(null)
                                    }}
                                    className={cn(
                                        "flex w-full flex-col gap-1 p-2.5 text-left text-xs transition-colors hover:bg-accent/50",
                                        isSelected && "bg-accent/80 shadow-xs ring-1 ring-border"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                            <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                                #{runNum}
                                            </span>
                                            <span className="truncate">{run.id.slice(0, 8)}</span>
                                            {runBrowser && (
                                                <span
                                                    title="Includes Cloud Browser Session"
                                                    className="inline-flex shrink-0"
                                                >
                                                    <Globe className="size-3 text-blue-500" />
                                                </span>
                                            )}
                                        </div>
                                        <RunStatusBadge status={run.status} />
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>{formatRelativeTime(run.createdAt)}</span>
                                        <div className="flex items-center gap-2 font-mono">
                                            <span>{runSteps.length} steps</span>
                                            <span>·</span>
                                            <span>{formatDuration(run.durationMs)}</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Column 2: Steps List of Selected Run */}
                <div className="flex w-72 shrink-0 flex-col min-h-0 bg-background">
                    <div className="flex h-8 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>Steps</span>
                        <span>{steps.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                        {steps.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                {selectedRun?.status === "EXECUTING"
                                    ? "Initializing steps..."
                                    : "No steps recorded for this run."}
                            </div>
                        ) : (
                            steps.map((step, idx) => {
                                const isSelected =
                                    rightPaneMode === "step" && idx === effectiveStepIndex
                                const stepNum = idx + 1

                                return (
                                    <button
                                        key={step.nodeId || idx}
                                        type="button"
                                        onClick={() => {
                                            setSelectedStepIndex(idx)
                                            setRightPaneMode("step")
                                        }}
                                        className={cn(
                                            "flex w-full items-center gap-2.5 p-2.5 text-left text-xs transition-colors hover:bg-accent/50",
                                            isSelected && "bg-accent/80 font-medium ring-1 ring-border"
                                        )}
                                    >
                                        <span className="font-mono text-[11px] text-muted-foreground/80 w-3.5 text-right shrink-0">
                                            {stepNum}
                                        </span>

                                        <StepIconChip nodeType={step.nodeType} />

                                        <div className="flex flex-1 flex-col truncate min-w-0">
                                            <span className="truncate text-foreground font-medium">
                                                {step.title || `Step ${stepNum}`}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono truncate">
                                                {step.nodeType}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {step.durationMs !== undefined && (
                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                    {formatDuration(step.durationMs)}
                                                </span>
                                            )}
                                            <StepStatusBadge
                                                status={step.status}
                                                isLive={isLive}
                                            />
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Column 3: Step Detail Inspector OR Live Cloud Browser */}
                <div className="flex flex-1 flex-col min-h-0 bg-card/40">
                    {rightPaneMode === "browser" ? (
                        <CloudBrowserPanel
                            browserSession={browserSession}
                            steps={steps}
                            isLive={isLive}
                            onSelectStep={(idx) => {
                                setSelectedStepIndex(idx)
                                setRightPaneMode("step")
                            }}
                        />
                    ) : (
                        <StepDetailsPanel
                            step={selectedStep}
                            allSteps={steps}
                            isLive={isLive}
                            runError={selectedRun?.error}
                            browserSession={browserSession}
                            onOpenBrowserView={() => setRightPaneMode("browser")}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
