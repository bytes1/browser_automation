"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useRealtimeRun, useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type {
    BrowserSessionInfo,
    RunStep,
    runWorkflowTask,
} from "@/features/workflows/tasks/run-workflow"

export type WorkflowRun = ReturnType<
    typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

export interface WorkflowRunsContextValue {
    runs: WorkflowRun[]
    error?: Error
    watchRun: (runId: string, accessToken: string) => void
    activeRun?: WorkflowRun
    isWatchingRun: boolean
}

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)

export function getRunSteps(run: WorkflowRun): RunStep[] {
    const outputSteps = run.output?.steps
    if (Array.isArray(outputSteps) && outputSteps.length > 0) {
        return outputSteps as RunStep[]
    }
    const metadataSteps = run.metadata?.steps
    if (Array.isArray(metadataSteps) && metadataSteps.length > 0) {
        return metadataSteps as unknown as RunStep[]
    }
    return []
}

export function getRunBrowserSession(run: WorkflowRun): BrowserSessionInfo | undefined {
    const outputSession = run.output?.browserSession
    if (outputSession && typeof outputSession === "object" && "sessionId" in outputSession) {
        return outputSession as BrowserSessionInfo
    }
    const metadataSession = run.metadata?.browserSession
    if (
        metadataSession &&
        typeof metadataSession === "object" &&
        "sessionId" in metadataSession
    ) {
        return metadataSession as unknown as BrowserSessionInfo
    }
    return undefined
}

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

    const allRuns = useMemo(() => {
        const list = [...runs]
        if (activeRun) {
            const index = list.findIndex((r) => r.id === activeRun.id)
            if (index === -1) {
                list.unshift(activeRun as WorkflowRun)
            } else {
                list[index] = activeRun as WorkflowRun
            }
        }
        return list.sort((a, b) => {
            const tA = new Date(a.createdAt).getTime()
            const tB = new Date(b.createdAt).getTime()
            return tB - tA
        })
    }, [runs, activeRun])

    const value = useMemo<WorkflowRunsContextValue>(
        () => ({
            runs: allRuns,
            error,
            watchRun,
            activeRun: activeRun as WorkflowRun | undefined,
            isWatchingRun: activeRunRequest !== null,
        }),
        [allRuns, error, watchRun, activeRun, activeRunRequest]
    )

    return (
        <WorkflowRunsContext.Provider value={value}>
            {children}
        </WorkflowRunsContext.Provider>
    )
}

export function useWorkflowRuns() {
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
    browserSession?: BrowserSessionInfo
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

        const run = activeRun ?? runs[0]

        if (!run) return { steps: [], isLive: false }

        const isLive = run.status === "QUEUED" || run.status === "EXECUTING"
        const steps = getRunSteps(run)
        const browserSession = getRunBrowserSession(run)

        return { steps, isLive, browserSession }
    }, [runs, activeRun, isWatchingRun])
}
