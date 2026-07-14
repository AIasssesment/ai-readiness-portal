export type SavingsAssumptions = {
  affected_headcount: number
  hours_per_person_per_week: number
  blended_hourly_rate_usd: number
  /** Fraction of those hours AI can reclaim (0–1). */
  efficiency: number
}

export type OpportunityDetails = {
  expected_roi?: string
  savings_confidence?: string
  capabilities?: string[]
  integrations?: string[]
  evidence?: string[]
}

/** Round to `sig` significant figures (default 2) to avoid fake precision like $56,160. */
export function roundToSignificantFigures(value: number, sig = 2): number {
  if (!Number.isFinite(value) || value === 0) return 0
  const abs = Math.abs(value)
  const d = Math.floor(Math.log10(abs)) + 1
  const power = sig - d
  const magnitude = 10 ** power
  const rounded = Math.round(abs * magnitude) / magnitude
  return value < 0 ? -rounded : rounded
}

/** Conservative caps so one use case cannot imply unrealistic company-wide savings. */
export function clampAssumptionsForCompany(
  input: SavingsAssumptions,
  companySize: string | null | undefined,
): SavingsAssumptions {
  const companyHeadcount = inferCompanyHeadcount(companySize)
  const maxAffected = Math.max(1, Math.min(25, Math.floor(companyHeadcount * 0.2)))

  return {
    affected_headcount: clamp(input.affected_headcount, 0, maxAffected),
    hours_per_person_per_week: clamp(input.hours_per_person_per_week, 0, 6),
    blended_hourly_rate_usd: clamp(input.blended_hourly_rate_usd, 18, 95),
    efficiency: clamp(input.efficiency, 0, 0.4),
  }
}

export function computeWeeklyHoursSaved(assumptions: SavingsAssumptions): number {
  const a = assumptions
  return Number((a.affected_headcount * a.hours_per_person_per_week * a.efficiency).toFixed(1))
}

/**
 * annual_savings = headcount × hours/person/week × 52 × rate × efficiency
 * Final amount is rounded to 2 significant figures in code (LLM must not invent totals).
 */
export function computeAnnualSavingsUsd(assumptions: SavingsAssumptions): number {
  const a = assumptions
  const raw =
    a.affected_headcount *
    a.hours_per_person_per_week *
    52 *
    a.blended_hourly_rate_usd *
    a.efficiency
  return roundToSignificantFigures(raw, 2)
}

export function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "$0"
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    const m = roundToSignificantFigures(value / 1_000_000, 2)
    return `$${m}M`
  }
  if (abs >= 1000) {
    const k = roundToSignificantFigures(value / 1000, 2)
    return `$${k}k`
  }
  return `$${Math.round(value).toLocaleString()}`
}

export function formatAssumptionsCaption(assumptions: SavingsAssumptions | null | undefined): string | null {
  if (!assumptions) return null
  const { affected_headcount: hc, hours_per_person_per_week: hours, blended_hourly_rate_usd: rate, efficiency } =
    assumptions
  if ([hc, hours, rate, efficiency].some((v) => v == null || !Number.isFinite(Number(v)))) return null
  return `${hc} people × ${hours} h/wk × 52 × $${rate}/h × ${Math.round(Number(efficiency) * 100)}%`
}

/** Prefer a single primary department (models often dump comma-joined lists). */
export function primaryDepartment(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const first = raw
    .split(/[,/;|]/)
    .map((part) => part.trim())
    .find(Boolean)
  if (!first) return null
  return first.replace(/\s+and\s+/i, " & ").slice(0, 60)
}

/** Strip machine field prefixes from evidence strings for human-readable bullets. */
export function cleanEvidenceItems(items: string[] | null | undefined): string[] {
  if (!items?.length) return []
  const prefix =
    /^(likely_workflows|pain_points|tech_signals|workforce_insights|departments|evidence|assumptions|business_model|industry_context|confirmed_pain_points|hiring_signals|recent_news)\s*:\s*/i
  const questionIdTail = /\s*\(q\d+\)\s*$/i
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const cleaned = String(raw || "")
      .replace(prefix, "")
      .replace(questionIdTail, "")
      .replace(/^["']|["']$/g, "")
      .trim()
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
  }
  return out.slice(0, 6)
}

/** Drop placeholder / gibberish decision-maker titles from LLM output. */
export function sanitizeDecisionMakers(items: string[] | null | undefined): string[] {
  if (!items?.length) return []
  const junk = /\b(eqwe|asdf|lorem|ipsum|test|xxx|foo|bar|placeholder|n\/a|tbd|unknown)\b/i
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const title = String(raw || "").replace(/\s+/g, " ").trim()
    if (title.length < 2 || title.length > 80) continue
    if (junk.test(title)) continue
    if (/head of\s+['"`]/.test(title.toLowerCase())) continue
    if (/^['"`].*['"`]$/.test(title)) continue
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(title)
  }
  return out.slice(0, 6)
}

function inferCompanyHeadcount(companySize: string | null | undefined): number {
  const s = (companySize || "").toLowerCase()
  if (s.includes("5000") || s.includes("enterprise")) return 2500
  if (s.includes("501") && s.includes("5000")) return 700
  if ((s.includes("51") && s.includes("500")) || s.includes("mid")) return 160
  if (s.includes("1-50") || s.includes("1–50") || s.includes("small")) return 28
  const asNumber = Number.parseInt(s.replace(/[^\d].*$/, ""), 10)
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber
  return 80
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}
