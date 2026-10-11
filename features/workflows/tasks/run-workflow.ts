import toposort from "toposort"
import { logger, task } from "@trigger.dev/sdk"
import { Stagehand, browserbase } from "@browserbasehq/stagehand"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"
import { getWorkflow } from "@/features/workflows/data"
// Import NodeType so we can safely cast the registry key
import type { NodeType } from "@/features/workflows/nodes/node-registry"

type Browser = Awaited<ReturnType<typeof browserbase.launch>>
type Page = Awaited<ReturnType<Browser["context"]["pages"]>>[number]

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

            stagehand = await Stagehand.create({
                browser,
                model: {
                    modelName: "google/gemini-2.5-flash"
                }
                // disablePino is completely removed in V4
            })

            const pages = await browser.context.pages()
            page = pages[0]

            return { stagehand, page }
        }

        for (const id of order) {
            const node = byId.get(id)!
            logger.log(`Running step: ${node.data.title}`)

            // Cast node.data.type to NodeType so TypeScript knows it's a valid key
            const executor = nodeExecutors[node.data.type as NodeType]
            if (executor) await executor({ values: node.data.values, getStagehand })
        }

        await browser?.close()

        return { steps: order.length }
    },
})
