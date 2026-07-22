import { sql } from "@/lib/db"
import {
  extractCompanyUrn,
  isApifyConfigured,
  scrapeLinkedInCompany,
  scrapeLinkedInCompanyJobs,
} from "@/lib/company-enrichment/apify"
import { normalizeEnrichmentPayload } from "@/lib/company-enrichment/normalize"
import {
  EMPTY_NORMALIZED,
  type EnrichmentStatus,
  type NormalizedEnrichment,
} from "@/lib/company-enrichment/schema"
import { isLinkedInCompanyUrl } from "@/lib/utils"

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

type EnrichmentRow = {
  id: string
  client_id: string
  linkedin_url: string
  status: EnrichmentStatus
  apify_company_run_id: string | null
  apify_jobs_run_id: string | null
  sources: unknown
  normalized: unknown
  error: string | null
  fetched_at: Date | string | null
}

function parseNormalized(value: unknown): NormalizedEnrichment {
  if (!value || typeof value !== "object") return { ...EMPTY_NORMALIZED, detected_jobs: [], implied_roles: [] }
  const row = value as Partial<NormalizedEnrichment>
  return {
    company: {
      name: row.company?.name ?? null,
      about: row.company?.about ?? null,
      industry: row.company?.industry ?? null,
      company_size: row.company?.company_size ?? null,
      headquarters: row.company?.headquarters ?? null,
      open_job_count: row.company?.open_job_count ?? null,
      website: row.company?.website ?? null,
      exact_employee_count: row.company?.exact_employee_count ?? null,
    },
    detected_jobs: Array.isArray(row.detected_jobs) ? row.detected_jobs : [],
    implied_roles: Array.isArray(row.implied_roles) ? row.implied_roles : [],
  }
}

function hasUsableNormalized(normalized: NormalizedEnrichment): boolean {
  return Boolean(
    normalized.company.name ||
      normalized.company.about ||
      normalized.detected_jobs.length ||
      normalized.implied_roles.length,
  )
}

function isFresh(fetchedAt: Date | string | null | undefined): boolean {
  if (!fetchedAt) return false
  const t = fetchedAt instanceof Date ? fetchedAt.getTime() : new Date(fetchedAt).getTime()
  if (!Number.isFinite(t)) return false
  return Date.now() - t < CACHE_TTL_MS
}

async function getClientLinkedIn(clientId: string): Promise<string | null> {
  const rows = await sql<Array<{ linkedin: string | null }>>`
    select linkedin from clients where id = ${clientId}::uuid limit 1
  `
  return rows[0]?.linkedin?.trim() || null
}

async function getEnrichmentRow(clientId: string): Promise<EnrichmentRow | null> {
  const rows = await sql<EnrichmentRow[]>`
    select *
    from company_enrichment
    where client_id = ${clientId}::uuid
    limit 1
  `
  return rows[0] ?? null
}

async function upsertEnrichment(input: {
  clientId: string
  linkedinUrl: string
  status: EnrichmentStatus
  apifyCompanyRunId?: string | null
  apifyJobsRunId?: string | null
  sources?: Record<string, unknown>
  normalized?: NormalizedEnrichment
  error?: string | null
  fetchedAt?: boolean
}): Promise<void> {
  const sources = input.sources ?? {}
  const normalized = input.normalized ?? EMPTY_NORMALIZED
  const companyRun = input.apifyCompanyRunId ?? null
  const jobsRun = input.apifyJobsRunId ?? null
  const error = input.error ?? null

  await sql`
    insert into company_enrichment (
      client_id, linkedin_url, status,
      apify_company_run_id, apify_jobs_run_id,
      sources, normalized, error, fetched_at, updated_at
    ) values (
      ${input.clientId}::uuid,
      ${input.linkedinUrl},
      ${input.status},
      ${companyRun},
      ${jobsRun},
      ${sql.json(JSON.parse(JSON.stringify(sources)))},
      ${sql.json(JSON.parse(JSON.stringify(normalized)))},
      ${error},
      ${input.fetchedAt ? sql`now()` : null},
      now()
    )
    on conflict (client_id) do update set
      linkedin_url = excluded.linkedin_url,
      status = excluded.status,
      apify_company_run_id = excluded.apify_company_run_id,
      apify_jobs_run_id = excluded.apify_jobs_run_id,
      sources = excluded.sources,
      normalized = excluded.normalized,
      error = excluded.error,
      fetched_at = coalesce(excluded.fetched_at, company_enrichment.fetched_at),
      updated_at = now()
  `
}

export type EnsureEnrichmentResult = {
  status: EnrichmentStatus
  normalized: NormalizedEnrichment | null
  fromCache: boolean
}

/** Run Apify enrichment for a client LinkedIn company URL. Safe to call from after(). */
export async function runCompanyEnrichment(clientId: string): Promise<EnsureEnrichmentResult> {
  const linkedinUrl = await getClientLinkedIn(clientId)
  if (!linkedinUrl) {
    return { status: "skipped", normalized: null, fromCache: false }
  }

  if (!isLinkedInCompanyUrl(linkedinUrl)) {
    await upsertEnrichment({
      clientId,
      linkedinUrl,
      status: "skipped",
      error: "LinkedIn URL is not a company page (/company/...)",
      normalized: EMPTY_NORMALIZED,
      sources: { reason: "not_company_url" },
    })
    return { status: "skipped", normalized: null, fromCache: false }
  }

  if (!isApifyConfigured()) {
    const existing = await getEnrichmentRow(clientId)
    const prior = existing ? parseNormalized(existing.normalized) : EMPTY_NORMALIZED
    const carry = hasUsableNormalized(prior)
    await upsertEnrichment({
      clientId,
      linkedinUrl,
      status: carry ? "ready" : "failed",
      error: "APIFY_TOKEN is not configured",
      normalized: prior,
      sources: { reason: "apify_not_configured" },
      // Keep prior fetched_at so TTL still applies for carry-forward.
    })
    return {
      status: carry ? "ready" : "failed",
      normalized: carry ? prior : null,
      fromCache: carry,
    }
  }

  const existing = await getEnrichmentRow(clientId)
  const priorNormalized = existing ? parseNormalized(existing.normalized) : EMPTY_NORMALIZED

  await upsertEnrichment({
    clientId,
    linkedinUrl,
    status: "pending",
    error: null,
    normalized: priorNormalized,
    sources: typeof existing?.sources === "object" && existing?.sources ? (existing.sources as Record<string, unknown>) : {},
  })

  let companyRunId: string | null = null
  let jobsRunId: string | null = null
  let companyItem: Record<string, unknown> | null = null
  let jobItems: Record<string, unknown>[] = []
  const sources: Record<string, unknown> = {}

  try {
    const companyResult = await scrapeLinkedInCompany(linkedinUrl)
    companyRunId = companyResult.runId
    companyItem = companyResult.item
    sources["apify:linkedin-company"] = {
      ok: Boolean(companyItem),
      run_id: companyRunId,
      fetched_at: new Date().toISOString(),
      raw: companyItem,
    }

    if (!companyItem) {
      throw new Error("Apify company scraper returned no items")
    }

    const urn = extractCompanyUrn(companyItem)
    if (urn) {
      try {
        const jobsResult = await scrapeLinkedInCompanyJobs(urn)
        jobsRunId = jobsResult.runId
        jobItems = jobsResult.items
        sources["apify:linkedin-jobs"] = {
          ok: true,
          run_id: jobsRunId,
          fetched_at: new Date().toISOString(),
          count: jobItems.length,
        }
      } catch (jobsError) {
        console.warn("linkedin jobs scrape failed; continuing with company only", jobsError)
        sources["apify:linkedin-jobs"] = {
          ok: false,
          error: jobsError instanceof Error ? jobsError.message : "jobs scrape failed",
        }
      }
    } else {
      sources["apify:linkedin-jobs"] = { ok: false, error: "companyUrn missing from company scrape" }
    }

    const normalized = await normalizeEnrichmentPayload({ companyItem, jobItems })

    await upsertEnrichment({
      clientId,
      linkedinUrl,
      status: "ready",
      apifyCompanyRunId: companyRunId,
      apifyJobsRunId: jobsRunId,
      sources,
      normalized,
      error: null,
      fetchedAt: true,
    })

    return { status: "ready", normalized, fromCache: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : "enrichment failed"
    console.error("company enrichment failed", error)

    const carry = hasUsableNormalized(priorNormalized)
    await upsertEnrichment({
      clientId,
      linkedinUrl,
      status: carry ? "ready" : "failed",
      apifyCompanyRunId: companyRunId,
      apifyJobsRunId: jobsRunId,
      sources: {
        ...sources,
        error: message,
      },
      normalized: priorNormalized,
      error: message,
      // Do not bump fetched_at on failure — preserve cache TTL for carry-forward.
    })

    return {
      status: carry ? "ready" : "failed",
      normalized: carry ? priorNormalized : null,
      fromCache: carry,
    }
  }
}

/**
 * Return fresh enrichment or refresh when missing/stale/failed.
 * Does not throw — Job Risk generate must continue on failure.
 */
export async function ensureEnrichment(clientId: string): Promise<EnsureEnrichmentResult> {
  const linkedinUrl = await getClientLinkedIn(clientId)
  if (!linkedinUrl) {
    return { status: "skipped", normalized: null, fromCache: false }
  }

  if (!isLinkedInCompanyUrl(linkedinUrl)) {
    const existing = await getEnrichmentRow(clientId)
    if (existing?.status === "skipped") {
      return { status: "skipped", normalized: null, fromCache: true }
    }
    return runCompanyEnrichment(clientId)
  }

  const existing = await getEnrichmentRow(clientId)
  if (
    existing &&
    existing.status === "ready" &&
    existing.linkedin_url === linkedinUrl &&
    isFresh(existing.fetched_at)
  ) {
    const normalized = parseNormalized(existing.normalized)
    if (hasUsableNormalized(normalized)) {
      return { status: "ready", normalized, fromCache: true }
    }
  }

  return runCompanyEnrichment(clientId)
}

/** Map implied roles into workforce-shaped rows for Job Risk. */
export function impliedRolesToWorkforce(
  enrichment: NormalizedEnrichment,
  fallbackCompanySize: string | null,
): Array<{
  role_title: string
  normalized_role: string
  department: string | null
  employee_count: number
}> {
  const roles = enrichment.implied_roles
  if (!roles.length) return []

  const exact = enrichment.company.exact_employee_count
  const fromSize = inferHeadcount(enrichment.company.company_size || fallbackCompanySize)
  const target = Math.max(roles.length, exact && exact > 0 ? exact : fromSize)
  const n = roles.length
  const base = Math.max(1, Math.floor(target / n))
  let used = 0

  return roles.map((role, i) => {
    const isLast = i === n - 1
    const employee_count = isLast ? Math.max(1, target - used) : base
    used += employee_count
    return {
      role_title: role.role_title,
      normalized_role: role.role_title.trim().toLowerCase(),
      department: role.department,
      employee_count,
    }
  })
}

function inferHeadcount(companySize: string | null): number {
  const s = (companySize || "").toLowerCase()
  if (s.includes("10001") || s.includes("10,001")) return 15000
  if (s.includes("5001") || s.includes("5,001")) return 7500
  if (s.includes("1001") || s.includes("1,001")) return 2500
  if (s.includes("501")) return 750
  if (s.includes("201")) return 300
  if (s.includes("51")) return 120
  if (s.includes("11")) return 30
  if (s.includes("1-10") || s.includes("1–10")) return 8
  if (s.includes("5000") || s.includes("enterprise")) return 3500
  if ((s.includes("51") && s.includes("500")) || s.includes("mid")) return 160
  if (s.includes("1-50") || s.includes("1–50") || s.includes("small")) return 28
  const digits = s.replace(/,/g, "").match(/\d+/g)
  if (digits?.length) {
    const nums = digits.map(Number).filter(Number.isFinite)
    if (nums.length >= 2) return Math.round((nums[0]! + nums[1]!) / 2)
    if (nums.length === 1) return nums[0]!
  }
  return 80
}
