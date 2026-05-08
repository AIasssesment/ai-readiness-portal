import { generateObject } from "ai"
import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import type { ContextData } from "@/lib/chat-context"
import { t, type Locale, type TranslationKey } from "@/lib/i18n"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const intentSchema = z.object({
  type: z.enum(["KPI_SUMMARY", "RISK_ANALYSIS", "ACTION_PLAN", "DATA_GAP", "GENERAL_QA"]),
  needs_more_data: z.boolean(),
  required_data: z.array(z.string()),
})

export type ChatIntent = z.infer<typeof intentSchema>["type"]

const TASK_KEYS: Record<ChatIntent, TranslationKey> = {
  KPI_SUMMARY: "chat.task.KPI_SUMMARY",
  RISK_ANALYSIS: "chat.task.RISK_ANALYSIS",
  ACTION_PLAN: "chat.task.ACTION_PLAN",
  DATA_GAP: "chat.task.DATA_GAP",
  GENERAL_QA: "chat.task.GENERAL_QA",
}

function getTaskInstruction(intent: ChatIntent, locale: Locale) {
  return t(locale, TASK_KEYS[intent])
}

export async function classifyChatIntent(userMessage: string, locale: Locale) {
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
      system: t(locale, "chat.classifier.system"),
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

export function buildSystemPrompt(context: ContextData, intent: ChatIntent, clientId: string, locale: Locale) {
  const rules = [
    t(locale, "chat.rule.1"),
    t(locale, "chat.rule.2"),
    t(locale, "chat.rule.3"),
    t(locale, "chat.rule.4"),
    t(locale, "chat.rule.5"),
    t(locale, "chat.rule.6"),
    t(locale, "chat.rule.7"),
  ].map((line, index) => `${index + 1}) ${line}`)

  return `${t(locale, "chat.system.intro")}

${t(locale, "chat.hardRules.title")}
${rules.join("\n")}

${t(locale, "chat.intentLabel")} ${intent}
${t(locale, "chat.taskLabel")}
${getTaskInstruction(intent, locale)}

${t(locale, "chat.outputLabel")}
1) ${t(locale, "chat.output.1")}
2) ${t(locale, "chat.output.2")}
3) ${t(locale, "chat.output.3")}
4) ${t(locale, "chat.output.4")}

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
    insufficient_data_phrase: t(locale, "chat.insufficientData"),
    data_freshness_iso: new Date().toISOString(),
  },
  null,
  2,
)}
`
}
