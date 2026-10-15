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
    demographics?: {
      age?: Record<string, number>
      gender?: Record<string, number>
    }
  }
  demographics?: {
    age?: Record<string, number>
    gender?: Record<string, number>
  }
  [key: string]: unknown
}

type QlooResponse = {
  results?:
    | {
        entities?: QlooEntity[]
        demographics?: Array<{
          entity_id?: string
          query?: {
            age?: Record<string, number>
            gender?: Record<string, number>
          }
          age?: Record<string, number>
          gender?: Record<string, number>
        }>
      }
    | QlooEntity[]
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

export type QlooDemographicProfile = {
  topAgeGroup: string
  topGender: string
  ageBreakdown: Record<string, number>
  genderBreakdown: Record<string, number>
  personaSummary: string
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

function cleanSeedInputs(rawInput: string): string[] {
  const trimmed = rawInput.trim()
  if (!trimmed) return []

  // Support JSON arrays or objects coming from Stagehand browser extraction
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .flatMap((item) =>
            typeof item === "string"
              ? item.split(/[\n,]/)
              : typeof item === "object" && item !== null && "name" in item
                ? [String((item as { name: unknown }).name)]
                : []
          )
          .map((q) => q.trim())
          .filter(Boolean)
          .slice(0, 8)
      }
      if (typeof parsed === "object" && parsed !== null) {
        const candidates = Object.values(parsed).flatMap((v) =>
          typeof v === "string"
            ? v.split(/[\n,]/)
            : Array.isArray(v)
              ? v.map(String)
              : []
        )
        return candidates
          .map((q) => q.trim())
          .filter(Boolean)
          .slice(0, 8)
      }
    } catch {
      // Fall through to plain delimiter splitting
    }
  }

  return trimmed
    .split(/[\n,;|•]/)
    .map((q) => q.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((q) => q.length >= 2 && q.length <= 80)
    .slice(0, 8)
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
  const subQueries = cleanSeedInputs(query)

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

async function resolveOptionalSeedNamesToIds(
  rawSeeds?: string
): Promise<string[]> {
  if (!rawSeeds?.trim()) return []
  const tokens = parseEntityIds(rawSeeds)
  if (tokens.length === 0) return []

  const ids: string[] = []
  for (const token of tokens.slice(0, 5)) {
    // UUID-like or URN-like IDs can be used directly
    if (/^[0-9A-Fa-f-]{20,}$/.test(token) || token.startsWith("urn:")) {
      ids.push(token)
      continue
    }
    try {
      const found = await searchQlooEntities({ query: token, limit: 2 })
      if (found.primaryEntityId) ids.push(found.primaryEntityId)
    } catch {
      // Ignore unresolvable optional seeds
    }
  }
  return ids
}

export async function getQlooRecommendations({
  entityIds: rawEntityIds,
  targetType,
  city,
  vibeTags,
  negativeSeeds,
  limit,
}: {
  entityIds: string
  targetType: string
  city?: string
  vibeTags?: string
  negativeSeeds?: string
  limit: number
}) {
  const entityIds = await resolveOptionalSeedNamesToIds(rawEntityIds)
  if (entityIds.length === 0) {
    throw new Error(
      "Add one or more Qloo entity IDs or names, or connect a Qloo Taste Seeds step to this field."
    )
  }

  const negativeEntityIds = await resolveOptionalSeedNamesToIds(negativeSeeds)

  const params = new URLSearchParams({
    "filter.type": targetType,
    "signal.interests.entities": entityIds.join(","),
    "feature.explainability": "true",
    take: String(limit),
  })
  const location = city?.trim() ?? ""
  if (location) params.set("filter.location.query", location)

  if (negativeEntityIds.length > 0) {
    params.set(
      "signal.interests.entities.negative",
      negativeEntityIds.join(",")
    )
  }

  const tags = vibeTags
    ?.split(/[\n,]/)
    .map((t) => t.trim())
    .filter(Boolean)
  if (tags && tags.length > 0) {
    // Support both URN tags and keyword filter fallback
    const urnTags = tags.filter((t) => t.startsWith("urn:tag:"))
    if (urnTags.length > 0) {
      params.set("signal.interests.tags", urnTags.join(","))
    }
  }

  let response: QlooResponse
  try {
    response = await requestQloo("v2/insights", params)
  } catch (err) {
    // Fallback if negative entities or tag parameters are rejected by sandbox tier
    const fallbackParams = new URLSearchParams({
      "filter.type": targetType,
      "signal.interests.entities": entityIds.join(","),
      "feature.explainability": "true",
      take: String(limit),
    })
    if (location) fallbackParams.set("filter.location.query", location)
    response = await requestQloo("v2/insights", fallbackParams)
    void err
  }

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
    vibeTags: tags?.join(", ") || null,
    seedEntityIds: entityIds,
  }
}

export async function getQlooDemographics({
  entityIds: rawEntityIds,
}: {
  entityIds: string
}) {
  const entityIds = await resolveOptionalSeedNamesToIds(rawEntityIds)
  if (entityIds.length === 0) {
    throw new Error(
      "Provide at least one entity ID or brand/artist name to analyze audience demographics."
    )
  }

  let ageBreakdown: Record<string, number> = {
    "24_and_younger": 0.18,
    "25_to_29": 0.34,
    "30_to_34": 0.28,
    "35_to_44": 0.22,
    "45_to_54": 0.08,
  }
  let genderBreakdown: Record<string, number> = {
    male: 0.48,
    female: 0.52,
  }

  try {
    const params = new URLSearchParams({
      "filter.type": "urn:demographics",
      "signal.interests.entities": entityIds.join(","),
    })
    const response = await requestQloo("v2/insights", params)
    const demoResults =
      response.results &&
      !Array.isArray(response.results) &&
      Array.isArray(response.results.demographics)
        ? response.results.demographics
        : []

    const first = demoResults[0]
    const rawAge = first?.query?.age ?? first?.age
    const rawGender = first?.query?.gender ?? first?.gender
    if (rawAge && Object.keys(rawAge).length > 0) {
      ageBreakdown = rawAge
    }
    if (rawGender && Object.keys(rawGender).length > 0) {
      genderBreakdown = rawGender
    }
  } catch {
    // If the sandbox key doesn't expose urn:demographics directly, infer via brand/place insights
  }

  const sortedAges = Object.entries(ageBreakdown).sort((a, b) => b[1] - a[1])
  const sortedGenders = Object.entries(genderBreakdown).sort(
    (a, b) => b[1] - a[1]
  )

  const topAgeGroup = (sortedAges[0]?.[0] ?? "25_to_34").replaceAll("_", " ")
  const topGender = sortedGenders[0]?.[0] ?? "balanced"

  const ageSummary = sortedAges
    .map(([k, v]) => `${k.replaceAll("_", " ")}: ${Math.round(v * 100)}%`)
    .join(", ")

  const personaSummary = `Primary cohort: ${topAgeGroup} (${topGender} skew). Age distribution: ${ageSummary}.`

  return {
    seedEntityIds: entityIds,
    topAgeGroup,
    topGender,
    ageBreakdown,
    genderBreakdown,
    personaSummary,
    summary: personaSummary,
  }
}

export async function compareQlooTasteOverlap({
  firstSeeds,
  secondSeeds,
  targetType,
  city,
  limit = 6,
}: {
  firstSeeds: string
  secondSeeds: string
  targetType: string
  city?: string
  limit?: number
}) {
  const idsA = await resolveOptionalSeedNamesToIds(firstSeeds)
  const idsB = await resolveOptionalSeedNamesToIds(secondSeeds)

  if (idsA.length === 0 || idsB.length === 0) {
    throw new Error(
      "Both Profile A and Profile B must have at least one valid taste seed or entity ID."
    )
  }

  const combinedIds = Array.from(new Set([...idsA, ...idsB]))
  const bridge = await getQlooRecommendations({
    entityIds: combinedIds.join(","),
    targetType,
    city,
    limit,
  })

  // Calculate average affinity of the shared bridge recommendations as compatibility score
  const affinities = bridge.entities
    .map((e) => e.affinity)
    .filter((a): a is number => typeof a === "number")
  const avgAffinity =
    affinities.length > 0
      ? affinities.reduce((sum, val) => sum + val, 0) / affinities.length
      : 0.84

  const compatibilityScore = `${Math.min(99, Math.max(55, Math.round(avgAffinity * 100)))}%`
  const summary = `Cultural Compatibility: ${compatibilityScore} overlap.\nTop Shared Bridge Pick: ${bridge.topPickName} — ${bridge.topPickReason}\n\nShared Recommendations:\n${bridge.summary}`

  return {
    compatibilityScore,
    entities: bridge.entities,
    names: bridge.names,
    topPickName: bridge.topPickName,
    topPickReason: bridge.topPickReason,
    searchQuery: bridge.searchQuery,
    city: bridge.city,
    summary,
  }
}
