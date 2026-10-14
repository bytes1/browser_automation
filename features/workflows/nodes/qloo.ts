type QlooEntity = {
  entity_id?: string
  id?: string
  name?: string
  type?: string
  entity_type?: string
  types?: string[]
  explanation?: string
  reason?: string
  attribution?: string
  reasons?: string[]
  query?: {
    affinity?: number
    explanation?: string
    reason?: string
    reasons?: string[]
  }
  [key: string]: unknown
}

type QlooResponse = {
  results?: { entities?: QlooEntity[] } | QlooEntity[]
  entities?: QlooEntity[]
  success?: boolean
}

export type QlooResultEntity = {
  id: string
  name: string
  type: string
  affinity: number | null
  explanation: string
  source: QlooEntity
}

function getQlooConfig() {
  const apiKey = process.env.QLOO_API_KEY
  if (!apiKey) {
    throw new Error(
      "QLOO_API_KEY is missing. Add it to your Trigger.dev environment to run Qloo workflow steps."
    )
  }

  // Search is hosted at /search while Insights is under /v2/insights. Accept
  // either the API origin or an older /v2 base URL in local configuration.
  const baseUrl = (
    process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com"
  )
    .replace(/\/v2\/?$/, "")
    .replace(/\/$/, "")
  return { apiKey, baseUrl }
}

async function requestQloo(
  path: string,
  params: URLSearchParams
): Promise<QlooResponse> {
  const { apiKey, baseUrl } = getQlooConfig()
  const response = await fetch(`${baseUrl}/${path}?${params.toString()}`, {
    headers: { "x-api-key": apiKey, accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  })

  if (!response.ok) {
    const responseText = await response.text().catch(() => "")
    throw new Error(
      `Qloo ${path} request failed (${response.status}): ${responseText.slice(0, 300)}`
    )
  }

  return (await response.json()) as QlooResponse
}

function extractExplanation(entity: QlooEntity, targetType?: string): string {
  if (typeof entity.explanation === "string" && entity.explanation.trim()) {
    return entity.explanation.trim()
  }
  if (typeof entity.reason === "string" && entity.reason.trim()) {
    return entity.reason.trim()
  }
  if (typeof entity.attribution === "string" && entity.attribution.trim()) {
    return entity.attribution.trim()
  }
  if (Array.isArray(entity.reasons) && entity.reasons.length > 0) {
    return entity.reasons.map(String).join(", ")
  }

  const queryObj = entity.query
  if (queryObj) {
    if (typeof queryObj.explanation === "string" && queryObj.explanation.trim()) {
      return queryObj.explanation.trim()
    }
    if (typeof queryObj.reason === "string" && queryObj.reason.trim()) {
      return queryObj.reason.trim()
    }
    if (Array.isArray(queryObj.reasons) && queryObj.reasons.length > 0) {
      return queryObj.reasons.map(String).join(", ")
    }
  }

  const rawAffinity =
    typeof queryObj?.affinity === "number" ? queryObj.affinity : null
  const cleanCategory =
    targetType?.replace("urn:entity:", "").replace("_", " ") || "places"

  if (rawAffinity !== null) {
    const pct = Math.round(rawAffinity * 100)
    return `${pct}% cultural affinity match with your taste seeds in ${cleanCategory}`
  }

  return `High cultural resonance recommendation based on your taste profile`
}

function normalizeEntity(
  entity: QlooEntity,
  targetType?: string
): QlooResultEntity {
  const affinity =
    typeof entity.query?.affinity === "number" ? entity.query.affinity : null

  return {
    id: String(entity.entity_id ?? entity.id ?? ""),
    name: String(entity.name ?? "Unnamed result"),
    type: String(
      entity.entity_type ?? entity.type ?? entity.types?.[0] ?? "unknown"
    ),
    affinity,
    explanation: extractExplanation(entity, targetType),
    source: entity,
  }
}

function getEntities(response: QlooResponse): QlooEntity[] {
  if (Array.isArray(response.results)) return response.results
  if (response.results && Array.isArray(response.results.entities)) {
    return response.results.entities
  }
  return Array.isArray(response.entities) ? response.entities : []
}

export async function searchQlooEntities({
  query,
  entityType,
  limit,
}: {
  query: string
  entityType?: string
  limit: number
}) {
  // Support multi-seed input separated by commas or newlines (e.g., "Radiohead, Haruki Murakami")
  const subQueries = query
    .split(/[\n,]/)
    .map((q) => q.trim())
    .filter(Boolean)

  if (subQueries.length === 0) {
    throw new Error("Enter at least one favorite name or artist to search for.")
  }

  const resolvedEntities: QlooResultEntity[] = []

  for (const q of subQueries) {
    const params = new URLSearchParams({ query: q, take: String(limit) })
    if (entityType && entityType !== "any") params.set("types", entityType)

    try {
      const response = await requestQloo("search", params)
      const found = getEntities(response)
        .map((e) => normalizeEntity(e, entityType))
        .filter((entity) => entity.id)

      if (found.length > 0) {
        const normalizedQ = q.toLocaleLowerCase()
        const exactMatch =
          found.find(
            (entity) => entity.name.trim().toLocaleLowerCase() === normalizedQ
          ) ?? found[0]
        resolvedEntities.push(exactMatch)
      }
    } catch {
      // Continue to resolve remaining queries if one sub-query fails
    }
  }

  if (resolvedEntities.length === 0) {
    throw new Error(
      `Qloo returned no matching entity for "${query}". Try another name or choose a more specific category.`
    )
  }

  const selectedEntity = resolvedEntities[0]
  const entityIds = resolvedEntities.map((entity) => entity.id)
  const names = resolvedEntities.map((entity) => entity.name)

  const summary = `Resolved ${resolvedEntities.length} taste seed(s): ${names.join(", ")}`

  return {
    query,
    queries: subQueries,
    entities: resolvedEntities,
    selectedEntity,
    primaryEntityId: selectedEntity.id,
    primaryName: selectedEntity.name,
    entityIds,
    candidateEntityIds: entityIds,
    names,
    summary,
  }
}

function parseEntityIds(value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed) return []

  // Upstream array outputs are JSON encoded by workflow interpolation.
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed))
        return parsed
          .map(String)
          .map((id) => id.trim())
          .filter(Boolean)
    } catch {
      // Fall through to comma-separated parsing
    }
  }

  return trimmed
    .split(/[\n,]/)
    .map((id) => id.trim())
    .filter(Boolean)
}

export async function getQlooRecommendations({
  entityIds: rawEntityIds,
  targetType,
  city,
  limit,
}: {
  entityIds: string
  targetType: string
  city?: string
  limit: number
}) {
  const entityIds = parseEntityIds(rawEntityIds)
  if (entityIds.length === 0) {
    throw new Error(
      "Add one or more Qloo entity IDs, or connect a Qloo Taste Seeds step to this field."
    )
  }

  const params = new URLSearchParams({
    "filter.type": targetType,
    "signal.interests.entities": entityIds.join(","),
    "feature.explainability": "true",
    take: String(limit),
  })
  const location = city?.trim() ?? ""
  if (location) params.set("filter.location.query", location)

  const response = await requestQloo("v2/insights", params)
  const rawEntities = getEntities(response)
  const entities = rawEntities
    .map((e) => normalizeEntity(e, targetType))
    .filter((entity) => entity.id)
    .sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0))

  const names = entities.map((entity) => entity.name)
  const topPick = entities[0] ?? null
  const topPickName = topPick?.name ?? ""
  const topPickId = topPick?.id ?? ""
  const topPickReason = topPick?.explanation ?? ""

  const searchQuery = location
    ? `${topPickName} ${location} reviews reservations hours`
    : `${topPickName} reviews official guide`

  const summary = entities
    .slice(0, 5)
    .map((e, idx) => {
      const score =
        e.affinity !== null ? ` [${Math.round(e.affinity * 100)}% match]` : ""
      return `${idx + 1}. ${e.name}${score} — ${e.explanation}`
    })
    .join("\n")

  return {
    entities,
    names,
    entityIds: entities.map((entity) => entity.id),
    topPick,
    topPickName,
    topPickId,
    topPickReason,
    searchQuery,
    summary,
    targetType,
    city: location || null,
    seedEntityIds: entityIds,
  }
}

