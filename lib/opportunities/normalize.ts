export const PRIORITIES = ["high", "medium", "low"] as const
export const COMPLEXITIES = ["low", "medium", "high"] as const
export const TIMELINES = [
  "1-2 weeks",
  "1 month",
  "2-3 months",
  "3-6 months",
  "6+ months",
] as const
export const STATUSES = [
  "identified",
  "in_review",
  "approved",
  "in_progress",
  "completed",
  "rejected",
] as const

export type Priority = (typeof PRIORITIES)[number]
export type Complexity = (typeof COMPLEXITIES)[number]
export type Timeline = (typeof TIMELINES)[number]
export type OpportunityStatus = (typeof STATUSES)[number]

/** Deterministic cold pass: map free-text LLM output onto allowed enums. */
export function normalizePriority(raw: string | null | undefined): Priority {
  const v = (raw || "").toLowerCase().trim()
  if (["high", "h", "p0", "p1", "critical", "urgent"].includes(v)) return "high"
  if (["low", "l", "p3", "nice-to-have", "nice to have"].includes(v)) return "low"
  if (v.includes("high") || v.includes("critical")) return "high"
  if (v.includes("low") || v.includes("minor")) return "low"
  return "medium"
}

export function normalizeComplexity(raw: string | null | undefined): Complexity {
  const v = (raw || "").toLowerCase().trim()
  if (["low", "l", "easy", "simple"].includes(v) || v.includes("low")) return "low"
  if (["high", "h", "hard", "complex"].includes(v) || v.includes("high")) return "high"
  return "medium"
}

export function normalizeTimeline(raw: string | null | undefined): Timeline {
  const v = (raw || "").toLowerCase().replace(/\s+/g, " ").trim()
  if (!v) return "2-3 months"
  if (v.includes("1-2 week") || v.includes("1–2 week") || v === "2 weeks" || v.includes("two week")) {
    return "1-2 weeks"
  }
  if (v.includes("1 month") || v.includes("4 week") || v === "month") return "1 month"
  if (v.includes("2-3") || v.includes("2–3") || v.includes("8-12 week")) return "2-3 months"
  if (v.includes("3-6") || v.includes("3–6") || v.includes("quarter")) return "3-6 months"
  if (v.includes("6+") || v.includes("6 month") || v.includes("year") || v.includes("12")) {
    return "6+ months"
  }
  if (TIMELINES.includes(v as Timeline)) return v as Timeline
  return "2-3 months"
}

export function normalizeStatus(raw: string | null | undefined): OpportunityStatus {
  const v = (raw || "").toLowerCase().replace(/\s+/g, "_").trim()
  if (STATUSES.includes(v as OpportunityStatus)) return v as OpportunityStatus
  if (v.includes("review")) return "in_review"
  if (v.includes("recommend") || v.includes("identif")) return "identified"
  if (v.includes("progress")) return "in_progress"
  if (v.includes("approv")) return "approved"
  if (v.includes("complete") || v.includes("done")) return "completed"
  if (v.includes("reject")) return "rejected"
  return "identified"
}

export function dedupeByTitle<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}
