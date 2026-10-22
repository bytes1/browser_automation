import type { WorkflowGraph } from "@/lib/db/schema"

export type ScheduledWorkflowIdentity = {
  workflowId: string
  orgId: string
}

export type WorkflowTriggerRef =
  | { kind: "schedule"; id: string }
  | { kind: "run"; id: string }

export function parseWorkflowTriggerRef(value: string | null | undefined) {
  if (!value) return null
  try {
    const ref = JSON.parse(value) as WorkflowTriggerRef
    if ((ref.kind === "schedule" || ref.kind === "run") && ref.id) return ref
  } catch {
    return null
  }
  return null
}

const triggerRefKey = "__triggerRef"

export function getWorkflowTriggerRef(graph: WorkflowGraph | null | undefined) {
  const trigger = graph?.nodes.find((node) => node.data.kind === "trigger")
  return parseWorkflowTriggerRef(trigger?.data.values[triggerRefKey])
}

export function setWorkflowTriggerRefInGraph(
  graph: WorkflowGraph,
  ref: WorkflowTriggerRef | null,
): WorkflowGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.data.kind !== "trigger") return node
      const values = { ...node.data.values }
      if (ref) values[triggerRefKey] = JSON.stringify(ref)
      else delete values[triggerRefKey]
      return { ...node, data: { ...node.data, values } }
    }),
  }
}

export function workflowScheduleExternalId(workflowId: string, orgId: string) {
  return JSON.stringify({ workflowId, orgId })
}

/**
 * Trigger.dev Cloud validates schedule timezones against Node/V8's CLDR
 * `Intl.supportedValuesOf("timeZone")` list, which uses historical canonical
 * names like `Asia/Calcutta` instead of `Asia/Kolkata`. Normalize common
 * modern IANA aliases and shorthand codes before sending to Trigger.dev.
 */
const TRIGGER_TIMEZONE_ALIASES: Record<string, string> = {
  "asia/kolkata": "Asia/Calcutta",
  "ist": "Asia/Calcutta",
  "asia/mumbai": "Asia/Calcutta",
  "asia/delhi": "Asia/Calcutta",
  "asia/new_delhi": "Asia/Calcutta",
  "asia/bangalore": "Asia/Calcutta",
  "asia/chennai": "Asia/Calcutta",
  "asia/ho_chi_minh": "Asia/Saigon",
  "asia/kathmandu": "Asia/Katmandu",
  "asia/yangon": "Asia/Rangoon",
  "europe/kyiv": "Europe/Kiev",
  "us/eastern": "America/New_York",
  "us/central": "America/Chicago",
  "us/mountain": "America/Denver",
  "us/pacific": "America/Los_Angeles",
  "est": "America/New_York",
  "cst": "America/Chicago",
  "mst": "America/Denver",
  "pst": "America/Los_Angeles",
  "gmt": "UTC",
  "etc/utc": "UTC",
  "etc/gmt": "UTC",
}

export function normalizeTriggerTimezone(timezone: string): string {
  const trimmed = timezone.trim()
  const mapped = TRIGGER_TIMEZONE_ALIASES[trimmed.toLowerCase()]
  return mapped ?? trimmed
}

export function buildCronPattern(values: Record<string, string>) {
  const frequency = values.frequency ?? (values.cron ? "custom" : "daily")
  if (frequency === "once") return null
  if (frequency === "custom") return values.cron?.trim() ?? ""

  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(values.time ?? "")
  if (!time) return ""
  const [, hour, minute] = time

  switch (frequency) {
    case "daily":
      return `${minute} ${hour} * * *`
    case "weekdays":
      return `${minute} ${hour} * * 1-5`
    case "weekly":
      return `${minute} ${hour} * * ${values.weekday ?? "1"}`
    case "monthly":
      return `${minute} ${hour} ${values.monthday ?? "1"} * *`
    default:
      return ""
  }
}

export function zonedDateTimeToUtc(value: string, timezone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) throw new Error("Choose a date and time for the one-time run.")

  const [, yearText, monthText, dayText, hourText, minuteText] = match
  const desired = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
  }
  const wallTime = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  )
  const wallDate = new Date(wallTime)
  if (
    wallDate.getUTCFullYear() !== desired.year ||
    wallDate.getUTCMonth() + 1 !== desired.month ||
    wallDate.getUTCDate() !== desired.day
  ) {
    throw new Error("Choose a valid date and time.")
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeTriggerTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })

  let result = new Date(wallTime)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(result).map(({ type, value }) => [type, value]),
    )
    const representedWallTime = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )
    result = new Date(result.getTime() + wallTime - representedWallTime)
  }

  const finalParts = Object.fromEntries(
    formatter.formatToParts(result).map(({ type, value }) => [type, value]),
  )
  if (
    Number(finalParts.year) !== desired.year ||
    Number(finalParts.month) !== desired.month ||
    Number(finalParts.day) !== desired.day ||
    Number(finalParts.hour) !== desired.hour ||
    Number(finalParts.minute) !== desired.minute
  ) {
    throw new Error("That local time does not exist in the selected timezone.")
  }

  return result
}

