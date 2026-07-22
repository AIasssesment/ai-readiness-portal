import { generateObject } from "ai"
import { getLlmModel, isGoogleAiConfigured } from "@/lib/ai/model"
import {
  EMPTY_NORMALIZED,
  ImpliedRolesBatchSchema,
  type DetectedJob,
  type ImpliedRole,
  type NormalizedCompany,
  type NormalizedEnrichment,
} from "@/lib/company-enrichment/schema"

function asString(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s || null
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function pickFirstString(item: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = asString(item[key])
    if (v) return v
  }
  return null
}

/** Deterministic map from Apify company actor item → company fields. */
export function mapCompanyItem(item: Record<string, unknown> | null): NormalizedCompany {
  if (!item) {
    return { ...EMPTY_NORMALIZED.company }
  }

  const exact = asNumber(item.exactEmployeeCount ?? item.employeeCount ?? item.employees)
  const sizeRange = pickFirstString(item, ["companySizeRange", "companySize", "size"])
  const openJobs = asNumber(item.openJobCount ?? item.openJobsCount ?? item.jobCount)

  return {
    name: pickFirstString(item, ["companyName", "name", "title"]),
    about: pickFirstString(item, ["description", "about", "tagline", "slogan"]),
    industry: pickFirstString(item, ["industry"]),
    company_size: sizeRange || (exact != null ? String(exact) : null),
    headquarters: pickFirstString(item, ["headquarters", "hq", "headquarter"]),
    open_job_count: openJobs,
    website: pickFirstString(item, ["website", "companyWebsite", "url"]),
    exact_employee_count: exact,
  }
}

/** Deterministic map from Apify jobs actor rows → detected_jobs. */
export function mapJobItems(items: Record<string, unknown>[]): DetectedJob[] {
  const jobs: DetectedJob[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const title = pickFirstString(item, ["title", "jobTitle", "job_title", "position", "name"])
    if (!title) continue
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    jobs.push({
      job_title: title,
      location: pickFirstString(item, ["location", "jobLocation", "formattedLocation", "place"]),
      link: pickFirstString(item, ["url", "link", "jobUrl", "applyUrl", "externalUrl"]),
    })

    if (jobs.length >= 50) break
  }

  return jobs
}

function extractPeopleTitles(companyItem: Record<string, unknown> | null): string[] {
  if (!companyItem) return []
  const preview = companyItem.employeesPreview ?? companyItem.employees ?? companyItem.people
  if (!Array.isArray(preview)) return []

  const titles: string[] = []
  for (const person of preview) {
    if (!person || typeof person !== "object") continue
    const row = person as Record<string, unknown>
    const title = pickFirstString(row, ["title", "headline", "jobTitle", "position"])
    if (title) titles.push(title)
  }
  return titles.slice(0, 12)
}

function extractSpecialties(companyItem: Record<string, unknown> | null): string[] {
  if (!companyItem) return []
  const raw = companyItem.specialties ?? companyItem.specialty
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean).slice(0, 20)
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20)
  }
  return []
}

/**
 * Build implied roles via Gemini when configured; otherwise derive from job titles only.
 */
export async function buildImpliedRoles(input: {
  company: NormalizedCompany
  detectedJobs: DetectedJob[]
  companyItem: Record<string, unknown> | null
}): Promise<ImpliedRole[]> {
  const fromJobs: ImpliedRole[] = input.detectedJobs.slice(0, 25).map((job) => ({
    role_title: job.job_title,
    department: null,
    signal_source: "job_posting" as const,
  }))

  if (!isGoogleAiConfigured()) {
    return dedupeRoles(fromJobs)
  }

  const peopleTitles = extractPeopleTitles(input.companyItem)
  const specialties = extractSpecialties(input.companyItem)

  try {
    const { object } = await generateObject({
      model: getLlmModel(),
      schema: ImpliedRolesBatchSchema,
      system: `You map LinkedIn company signals into workforce roles for AI job-risk analysis.
Return implied_roles only. Do not invent companies or headcount.
Prefer concrete job/role titles. Assign a plausible department or null.
signal_source must be job_posting | about | people.
Max 30 roles. Deduplicate similar titles. Keep original language.`,
      prompt: `Company: ${input.company.name || "unknown"}
Industry: ${input.company.industry || "N/A"}
About: ${input.company.about || "N/A"}
Specialties: ${JSON.stringify(specialties)}
Open job titles: ${JSON.stringify(input.detectedJobs.map((j) => j.job_title))}
People preview titles: ${JSON.stringify(peopleTitles)}

Produce implied_roles grounded only in the signals above.`,
      temperature: 0.2,
    })
    return dedupeRoles(object.implied_roles)
  } catch (error) {
    console.warn("implied roles LLM normalize failed; using job titles only", error)
    return dedupeRoles(fromJobs)
  }
}

function dedupeRoles(roles: ImpliedRole[]): ImpliedRole[] {
  const seen = new Set<string>()
  const out: ImpliedRole[] = []
  for (const role of roles) {
    const key = role.role_title.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({
      role_title: role.role_title.trim(),
      department: role.department?.trim() || null,
      signal_source: role.signal_source,
    })
    if (out.length >= 30) break
  }
  return out
}

export async function normalizeEnrichmentPayload(input: {
  companyItem: Record<string, unknown> | null
  jobItems: Record<string, unknown>[]
}): Promise<NormalizedEnrichment> {
  const company = mapCompanyItem(input.companyItem)
  const detected_jobs = mapJobItems(input.jobItems)
  const implied_roles = await buildImpliedRoles({
    company,
    detectedJobs: detected_jobs,
    companyItem: input.companyItem,
  })

  return { company, detected_jobs, implied_roles }
}
