import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"
import Browserbase from "@browserbasehq/sdk"
import { Stagehand, browserbase, type ModelName } from "@browserbasehq/stagehand"
import {
    flush as flushNeatlogs,
    init as initNeatlogs,
    trace as traceNeatlogs,
    type TraceOptions as NeatlogsTraceOptions,
} from "neatlogs"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"
import {
    interpolate,
    type NodeOutputs,
} from "@/features/workflows/lib/interpolate"
import { getWorkflow } from "@/features/workflows/data"
// Import NodeType so we can safely cast the registry key
import type { NodeType } from "@/features/workflows/nodes/node-registry"

type Browser = Awaited<ReturnType<typeof browserbase.launch>>
type Page = Awaited<ReturnType<Browser["context"]["pages"]>>[number]

// Initialize once per Trigger worker. Neatlogs stays optional: without a key,
// or if initialization fails, workflow execution continues without tracing.
let neatlogsInitialization: Promise<boolean> | undefined

async function initializeNeatlogs() {
    const apiKey = process.env.NEATLOGS_API_KEY
    if (!apiKey) return false

    neatlogsInitialization ??= initNeatlogs({
        apiKey,
        workflowName: "browser-automation",
        // Trigger owns the worker lifecycle; don't let Neatlogs install its own
        // process-signal handlers or shut down a potentially warm worker.
        registerShutdownHandlers: false,
    })
        .then(() => true)
        .catch((error: unknown) => {
            logger.warn("Neatlogs initialization failed; continuing without tracing", {
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        })

    return neatlogsInitialization
}

// Keep telemetry fail-open without swallowing errors from the workflow itself.
async function withNeatlogsTrace<T>(
    enabled: boolean,
    options: NeatlogsTraceOptions,
    operation: () => Promise<T>
): Promise<T> {
    if (!enabled) return operation()

    let started = false
    let completed = false
    let operationFailed = false
    let result!: T
    let operationError: unknown

    try {
        await traceNeatlogs(options, async () => {
            started = true
            try {
                result = await operation()
                completed = true
            } catch (error) {
                operationFailed = true
                operationError = error
                throw error
            }
        })
    } catch (error) {
        if (operationFailed) throw operationError

        if (!started) {
            logger.warn("Neatlogs trace could not start; continuing without tracing", {
                error: error instanceof Error ? error.message : String(error),
            })
            return operation()
        }

        if (!completed) throw error

        // The workflow work completed; a finalization error must not undo it.
        logger.warn("Neatlogs trace finalization failed; workflow completed", {
            error: error instanceof Error ? error.message : String(error),
        })
    }

    return result
}

export type RunStep = {
    nodeId: string
    nodeType: string
    title: string
    status: "pending" | "running" | "done" | "failed"
    durationMs?: number
    output?: any
    error?: string
}

export type BrowserSessionInfo = {
    sessionId: string
    debuggerFullscreenUrl?: string
    debuggerUrl?: string
    sessionUrl: string
    status: "live" | "completed"
    currentUrl?: string
    currentTitle?: string
    startedAt: string
}

const BROWSER_NODE_TYPES = new Set(["open-url", "act", "extract", "observe"])

export const runWorkflowTask = task({
    id: "run-workflow",
    run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
        const workflow = await getWorkflow(orgId, workflowId)
        if (!workflow?.graph) throw new Error(`Workflow ${workflowId} has no graph`)

        const { nodes, edges } = workflow.graph
        const byId = new Map(nodes.map((n) => [n.id, n]))

        const connected = new Set(edges.flatMap((e) => [e.source, e.target]))

        const order = toposort
            .array(
                nodes.map((n) => n.id),
                edges.map((e) => [e.source, e.target])
            )
            .filter((id) => connected.has(id))

        logger.log(`Running workflow ${workflow.name}`, { steps: order.length })

        let steps: RunStep[] = order.map((nodeId) => {
            const node = byId.get(nodeId)
            return {
                nodeId,
                nodeType: (node?.data.type as string) ?? "start",
                title: node?.data.title ?? "Step",
                status: "pending",
            }
        })

        let browserSession: BrowserSessionInfo | undefined

        const updateStep = (index: number, patch: Partial<RunStep>) => {
            // Always publish a fresh snapshot. Trigger.dev compares metadata
            // values, so mutating this array in place can hide later updates.
            steps = steps.map((step, stepIndex) =>
                stepIndex === index ? { ...step, ...patch } : step
            )
            metadata.set("steps", steps as any)
        }

        const updateBrowserSession = (patch: Partial<BrowserSessionInfo>) => {
            if (!browserSession) return
            browserSession = { ...browserSession, ...patch }
            metadata.set("browserSession", browserSession as any)
        }

        metadata.set("steps", steps as any)
        await metadata.flush()

        const neatlogsEnabled = await initializeNeatlogs()

        let browser: Browser | undefined
        let page: Page | undefined
        let stagehand: Stagehand | undefined

        const getStagehand = async () => {
            if (stagehand && page) return { stagehand, page }

            const apiKey = process.env.BROWSERBASE_API_KEY
            if (!apiKey) {
                throw new Error("BROWSERBASE_API_KEY is missing from the Trigger.dev task environment")
            }

            try {
                browser = await browserbase.launch({
                    apiKey,
                    // Pre-uploading the bundled extension avoids an upload on
                    // every run. When unset, Stagehand provisions it normally.
                    ...(process.env.STAGEHAND_EXTENSION_ID
                        ? { extensionId: process.env.STAGEHAND_EXTENSION_ID }
                        : {}),
                })
            } catch (error) {
                const cause = error instanceof Error ? error.cause : undefined
                const status =
                    typeof cause === "object" && cause !== null && "status" in cause
                        ? cause.status
                        : undefined

                logger.error("Browserbase could not provision the Stagehand extension", {
                    error: error instanceof Error ? error.message : String(error),
                    cause: cause instanceof Error ? cause.message : String(cause ?? "Unknown cause"),
                    status,
                })
                throw error
            }

            const sessionId = browser.sessionId
            if (sessionId) {
                let debuggerFullscreenUrl: string | undefined
                let debuggerUrl: string | undefined

                try {
                    const bb = new Browserbase({ apiKey })
                    const debugUrls = await bb.sessions.debug(sessionId)
                    debuggerFullscreenUrl = debugUrls.debuggerFullscreenUrl
                    debuggerUrl = debugUrls.debuggerUrl
                } catch (debugError) {
                    logger.warn("Could not fetch Browserbase live debugger URLs", {
                        sessionId,
                        error: debugError instanceof Error ? debugError.message : String(debugError),
                    })
                }

                browserSession = {
                    sessionId,
                    debuggerFullscreenUrl,
                    debuggerUrl,
                    sessionUrl: `https://www.browserbase.com/sessions/${sessionId}`,
                    status: "live",
                    startedAt: new Date().toISOString(),
                }
                metadata.set("browserSession", browserSession as any)
                await metadata.flush()
            }

            const rawModel = process.env.STAGEHAND_MODEL?.trim()
            const resolvedModel: ModelName =
                !rawModel || rawModel === "google/gemini-3.5-flash-lite"
                    ? "google/gemini-2.5-flash"
                    : (rawModel as ModelName)

            stagehand = await Stagehand.create({
                browser,
                model: {
                    modelName: resolvedModel,
                },
                // disablePino is completely removed in V4
            })

            const pages = await browser.context.pages()
            page = pages[0]

            return { stagehand, page }
        }

        // Store each node's result so downstream node values can reference it.
        const outputs: NodeOutputs = {}

        const runWorkflow = () => withNeatlogsTrace(
            neatlogsEnabled,
            {
                name: workflow.name,
                kind: "WORKFLOW",
                sessionId: workflowId,
                sessionEntryPoint: "trigger.dev",
                attributes: { workflowId },
            },
            async () => {
                try {
                    for (let i = 0; i < order.length; i++) {
                        const id = order[i]
                        const node = byId.get(id)!
                        logger.log(`Running step: ${node.data.title}`)

                        const stepStartTime = Date.now()

                        // Cast node.data.type to NodeType so TypeScript knows it's a valid key.
                        const executor = nodeExecutors[node.data.type as NodeType]
                        if (!executor) {
                            // Trigger nodes have no executor, but still complete as workflow steps.
                            updateStep(i, {
                                status: "done",
                                durationMs: Date.now() - stepStartTime,
                                output: { triggered: true },
                            })
                            await metadata.flush()
                            continue
                        }

                        updateStep(i, { status: "running" })
                        await metadata.flush()

                        try {
                            // Resolve {{ nodeId.path }} placeholders from completed upstream nodes.
                            const values = Object.fromEntries(
                                Object.entries(node.data.values).map(([key, text]) => [
                                    key,
                                    interpolate({ text, outputs }),
                                ])
                            )

                            let stepResult: unknown
                            await withNeatlogsTrace(
                                neatlogsEnabled,
                                {
                                    name: node.data.title,
                                    kind: "TOOL",
                                    toolName: node.data.type,
                                    attributes: {
                                        workflowId,
                                        nodeId: id,
                                        nodeType: node.data.type,
                                    },
                                },
                                async () => {
                                    // Don't include instruction values or extracted page
                                    // data in telemetry; trace timing and node failures.
                                    stepResult = await executor({ values, getStagehand })
                                    outputs[id] = stepResult
                                }
                            )

                            // If this was a browser node and we have an active page, sync current URL & title
                            if (page && browserSession && BROWSER_NODE_TYPES.has(node.data.type as string)) {
                                try {
                                    const [currentUrl, currentTitle] = await Promise.all([
                                        page.url().catch(() => undefined),
                                        page.title().catch(() => undefined),
                                    ])
                                    updateBrowserSession({
                                        ...(currentUrl ? { currentUrl } : {}),
                                        ...(currentTitle ? { currentTitle } : {}),
                                    })
                                } catch {
                                    // Ignore transient page inspection errors
                                }
                            }

                            const durationMs = Date.now() - stepStartTime
                            updateStep(i, {
                                status: "done",
                                durationMs,
                                output: stepResult,
                            })
                            await metadata.flush()
                        } catch (error) {
                            const durationMs = Date.now() - stepStartTime
                            const errorMessage =
                                error instanceof Error
                                    ? error.message
                                    : typeof error === "object" && error !== null
                                        ? JSON.stringify(error)
                                        : String(error)

                            updateStep(i, {
                                status: "failed",
                                durationMs,
                                error: errorMessage,
                            })
                            await metadata.flush()
                            throw error
                        }
                    }

                    if (browserSession) {
                        updateBrowserSession({ status: "completed" })
                    }
                    await metadata.flush()
                    return { steps, browserSession }
                } finally {
                    if (browserSession && browserSession.status !== "completed") {
                        updateBrowserSession({ status: "completed" })
                        await metadata.flush().catch(() => { })
                    }
                    try {
                        await stagehand?.close()
                    } finally {
                        await browser?.close()
                    }
                }
            }
        )

        try {
            return await runWorkflow()
        } finally {
            if (neatlogsEnabled) {
                try {
                    const flushed = await flushNeatlogs()
                    if (!flushed) logger.warn("Neatlogs did not flush all workflow telemetry")
                } catch (error) {
                    logger.warn("Neatlogs flush failed; workflow result is unaffected", {
                        error: error instanceof Error ? error.message : String(error),
                    })
                }
            }
        }

    },
})
