import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_xtzahrhxemruvzoehzmt",
  runtime: "node-24",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["features"],
  build: {
    // Stagehand locates its bundled extension relative to its package file.
    // Keeping it external preserves that package-relative asset path in the
    // Trigger.dev worker instead of resolving it from the generated bundle.
    external: ["@browserbasehq/stagehand"],
  },
});
