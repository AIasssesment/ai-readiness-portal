import { ASSESSMENT_QUESTIONS } from "@/lib/assessment-data"

function optionLabel(questionId: string, value: unknown, optionIndex?: unknown): string | null {
  const question = ASSESSMENT_QUESTIONS.find((q) => q.id === questionId)
  if (!question) return null
  if (typeof optionIndex === "number" && question.options[optionIndex]) {
    return question.options[optionIndex].label
  }
  const numeric = Number(value)
  const match = question.options.find((opt) => opt.value === numeric)
  return match?.label ?? (value != null ? String(value) : null)
}

/** Human-readable assessment highlights for Stage 1 / Stage 2 (no raw q9 ids). */
export function buildAssessmentAnswerHighlights(answers: unknown): string[] {
  if (answers == null) return []

  const lines: string[] = []

  const pushAnswer = (questionId: string, value: unknown, optionIndex?: unknown) => {
    const question = ASSESSMENT_QUESTIONS.find((q) => q.id === questionId)
    const label = optionLabel(questionId, value, optionIndex)
    if (!question || !label) return
    lines.push(`${question.question} → ${label}`)
  }

  try {
    if (Array.isArray(answers)) {
      for (const item of answers.slice(0, 40)) {
        if (!item || typeof item !== "object") continue
        const row = item as Record<string, unknown>
        const questionId = String(row.questionId ?? "")
        if (!questionId) continue
        pushAnswer(questionId, row.value, row.optionIndex)
      }
      return lines
    }

    if (typeof answers === "object") {
      for (const [key, value] of Object.entries(answers as Record<string, unknown>).slice(0, 40)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const row = value as Record<string, unknown>
          pushAnswer(key, row.value ?? value, row.optionIndex)
        } else {
          pushAnswer(key, value)
        }
      }
    }
  } catch {
    return lines
  }

  return lines
}

export function extractWebsiteCandidate(companyInfo: unknown, companyName: string): string | null {
  if (companyInfo && typeof companyInfo === "object") {
    const row = companyInfo as Record<string, unknown>
    for (const key of ["website", "companyWebsite", "url", "companyName"]) {
      const value = String(row[key] ?? "").trim()
      if (/^https?:\/\//i.test(value) || /\./.test(value) && !/\s/.test(value)) {
        return value.startsWith("http") ? value : `https://${value}`
      }
    }
  }
  const name = companyName.trim()
  if (/^https?:\/\//i.test(name) || (/\./.test(name) && !/\s/.test(name))) {
    return name.startsWith("http") ? name : `https://${name}`
  }
  return null
}
