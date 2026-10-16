type SynthesizeParams = {
  format?: string
  instruction: string
  contextData: string
}

const synthesizeSchema = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    keyTakeaways: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    content: { type: "STRING" },
    actionRecommendation: { type: "STRING" },
  },
  required: ["headline", "keyTakeaways", "content", "actionRecommendation"],
}

export async function aiSynthesize({
  format = "brief",
  instruction,
  contextData,
}: SynthesizeParams) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to your environment to run the AI Cultural Synthesizer node."
    )
  }

  const formatGuide: Record<string, string> = {
    brief:
      "Write an executive cultural & market intelligence brief with clear sections.",
    itinerary:
      "Write a bespoke VIP travel & dining concierge itinerary with time-of-day recommendations and cultural rationale.",
    pitch:
      "Write a high-converting brand partnership & sponsorship pitch explaining audience and taste alignment.",
    outreach:
      "Write a hyper-personalized outreach email ready to send to a client or partner.",
  }

  const systemPrompt = `You are the AI Cultural & Web Intelligence Synthesizer inside Browsevibe, powered by Qloo Taste AI and Stagehand browser automation.
Your task is to combine upstream Qloo cultural affinity data and live browser-extracted web data into a polished, high-signal deliverable.
Style guide: ${formatGuide[format] ?? formatGuide.brief}
Never invent fake URLs. Ground all claims in the provided upstream context.`

  const userPrompt = `Instruction: ${instruction}\n\nUpstream Workflow Context & Data:\n${contextData}`

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 2500,
          responseMimeType: "application/json",
          responseSchema: synthesizeSchema,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    throw new Error(
      `Gemini synthesis failed (${response.status}): ${errText.slice(0, 240)}`
    )
  }

  const result = await response.json()
  const text = result?.candidates?.[0]?.content?.parts?.find(
    (p: { text?: string }) => p.text
  )?.text

  if (typeof text !== "string") {
    throw new Error("Gemini returned an empty synthesis response.")
  }

  const parsed = JSON.parse(text) as {
    headline: string
    keyTakeaways: string[]
    content: string
    actionRecommendation: string
  }

  const formattedSummary = `${parsed.headline}\n\nKey Takeaways:\n${parsed.keyTakeaways.map((t) => `• ${t}`).join("\n")}\n\n${parsed.content}\n\nNext Action: ${parsed.actionRecommendation}`

  return {
    headline: parsed.headline,
    keyTakeaways: parsed.keyTakeaways,
    content: parsed.content,
    actionRecommendation: parsed.actionRecommendation,
    summary: formattedSummary,
  }
}

