"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useRealtimeRun, useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type { RunStep, runWorkflowTask } from "@/features/workflows/tasks/run-workflow"

type WorkflowRun = ReturnType<
    typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

interface WorkflowRunsContextValue {
    runs: WorkflowRun[]
    error?: Error
    watchRun: (runId: string, accessToken: string) => void
    activeRun?: WorkflowRun
    isWatchingRun: boolean
}

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)

interface WorkflowRunsProviderProps {
    workflowId: string
    // A Public Access Token scoped to read this workflow's runs, minted on the
    // server (auth.createPublicToken) and handed down as a prop.
    accessToken: string
    children: React.ReactNode
}

// One shared realtime subscription to every run tagged workflow:<id>. Any
// component on the canvas reads it through the hooks below instead of opening
// its own socket.
export function WorkflowRunsProvider({
    workflowId,
    accessToken,
    children,
}: WorkflowRunsProviderProps) {
    const [activeRunRequest, setActiveRunRequest] = useState<{
        runId: string
        accessToken: string
    } | null>(null)
    const { runs, error } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
        `workflow:${workflowId}`,
        { accessToken }
    )
    const { run: activeRun } = useRealtimeRun<typeof runWorkflowTask>(
        activeRunRequest?.runId,
        {
            accessToken: activeRunRequest?.accessToken,
            enabled: activeRunRequest !== null,
        }
    )
    const watchRun = useCallback((runId: string, token: string) => {
        setActiveRunRequest({ runId, accessToken: token })
    }, [])

    const value = useMemo<WorkflowRunsContextValue>(
        () => ({
            runs,
            error,
            watchRun,
            activeRun: activeRun as WorkflowRun | undefined,
            isWatchingRun: activeRunRequest !== null,
        }),
        [runs, error, watchRun, activeRun, activeRunRequest]
    )

    return (
        <WorkflowRunsContext.Provider value={value}>
            {children}
        </WorkflowRunsContext.Provider>
    )
}

function useWorkflowRuns() {
    const ctx = useContext(WorkflowRunsContext)
    if (!ctx) {
        throw new Error(
            "useWorkflowRuns must be used within a WorkflowRunsProvider"
        )
    }
    return ctx
}

export function useWatchWorkflowRun() {
    return useWorkflowRuns().watchRun
}

interface LatestRunSteps {
    steps: RunStep[]
    // True while the latest run is queued or executing — i.e. still producing steps.
    isLive: boolean
}

// The steps of the most recent run, plus whether it's still going. Prefer the
// run's final output steps (guaranteed once it succeeds) and fall back to the
// live metadata steps the task publishes while it runs.
export function useLatestRunSteps(): LatestRunSteps {
    const { runs, activeRun, isWatchingRun } = useWorkflowRuns()

    return useMemo<LatestRunSteps>(() => {
        if (isWatchingRun && !activeRun) {
            return { steps: [], isLive: true }
        }

        const latest = runs.reduce<WorkflowRun | undefined>((newest, run) => {
            if (!newest || run.createdAt > newest.createdAt) return run
            return newest
        }, undefined)
        const run = activeRun ?? latest

        if (!run) return { steps: [], isLive: false }

        const isLive = run.status === "QUEUED" || run.status === "EXECUTING"
        const outputSteps = run.output?.steps
        const metadataSteps = run.metadata?.steps
        // Older runs returned a numeric `steps` count. Ignore that legacy shape
        // and use live metadata (or an empty list) instead of passing it to nodes.
        const steps = Array.isArray(outputSteps)
            ? (outputSteps as RunStep[])
            : Array.isArray(metadataSteps)
              ? (metadataSteps as RunStep[])
              : []

        return { steps, isLive }
    }, [runs, activeRun, isWatchingRun])
}
