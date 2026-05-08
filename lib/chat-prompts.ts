import { generateObject } from "ai"
import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import type { ContextData } from "@/lib/chat-context"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const intentSchema = z.object({
  type: z.enum(["KPI_SUMMARY", "RISK_ANALYSIS", "ACTION_PLAN", "DATA_GAP", "GENERAL_QA"]),
  needs_more_data: z.boolean(),
  required_data: z.array(z.string()),
})

export type ChatIntent = z.infer<typeof intentSchema>["type"]

function getTaskInstruction(intent: ChatIntent) {
  if (intent === "KPI_SUMMARY") {
    return [
      "Focus on current performance snapshot.",
      "Return up to 3 key numbers with short interpretation.",
      "Add one warning and one high-impact next action.",
    ].join("\n")
  }

  if (intent === "RISK_ANALYSIS") {
    return [
      "Identify top risks using context evidence only.",
      "For each risk provide evidence, impact, and one mitigation step.",
      "If evidence is incomplete, label the item as a hypothesis.",
    ].join("\n")
  }

  if (intent === "ACTION_PLAN") {
    return [
      "Build a practical 30/60/90-day plan based on available data.",
      "Each phase should include objective, 2-3 actions, and KPI.",
      "Do not assume hidden data.",
    ].join("\n")
  }

  if (intent === "DATA_GAP") {
    return [
      "Respond with 'Недостатньо даних' if context cannot answer the request.",
      "List exact missing fields/tables needed.",
      "Suggest the smallest possible data pull to unblock.",
    ].join("\n")
  }

  return [
    "Answer the user question directly and concisely.",
    "If context is insufficient, switch to 'Недостатньо даних' mode.",
  ].join("\n")
}

export async function classifyChatIntent(userMessage: string) {
  const trimmed = userMessage.trim()
  if (!trimmed) {
    return {
      type: "GENERAL_QA" as const,
      needs_more_data: false,
      required_data: [],
    }
  }

  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: intentSchema,
      system: [
        "You classify user prompts for a B2B analytics chat assistant.",
        "Return JSON only matching the schema.",
        "Use DATA_GAP when user asks for unavailable or external data.",
      ].join("\n"),
      prompt: `User message:\n${trimmed}`,
    })
    return result.object
  } catch {
    return {
      type: "GENERAL_QA" as const,
      needs_more_data: false,
      required_data: [],
    }
  }
}

export function buildSystemPrompt(context: ContextData, intent: ChatIntent, clientId: string) {
  return `You are an AI copilot for a B2B business portal.

Hard rules:
1) Work only with data from the provided CLIENT_CONTEXT.
2) Never invent facts, metrics, records, or IDs.
3) If context is insufficient, explicitly say "Недостатньо даних" and list missing fields/tables.
4) Respect tenant isolation: never reference other clients.
5) Prefer actionable and measurable recommendations.
6) Keep answers concise and structured.
7) Before finalizing, verify each claim is traceable to CLIENT_CONTEXT.

Intent mode: ${intent}
Task instructions:
${getTaskInstruction(intent)}

Output format:
1) Поточний стан
2) Ризики
3) Можливості
4) Наступні 3 кроки

CLIENT_CONTEXT:
${JSON.stringify(
  {
    client_id: clientId,
    company_name: context.companyName,
    industry: context.industry,
    company_size: context.companySize,
    latest_assessment: {
      score: context.score,
      readiness_level: context.readinessLevel,
      dimension_scores: context.dimensionScores,
    },
    top_opportunities: context.opportunities,
    job_risk: context.jobRisk,
    data_freshness_iso: new Date().toISOString(),
  },
  null,
  2,
)}
`
}
