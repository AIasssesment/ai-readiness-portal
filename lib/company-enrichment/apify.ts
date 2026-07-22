/**
 * Apify LinkedIn enrichment connectors for Job Risk.
 *
 * Env:
 * - APIFY_TOKEN (required to run actors)
 * - APIFY_LINKEDIN_COMPANY_ACTOR_ID (default: sourabhbgp/linkedin-company-scraper)
 * - APIFY_LINKEDIN_JOBS_ACTOR_ID (default: kaix/linkedin-jobs-scraper)
 */
import { ApifyClient } from "apify-client"

const DEFAULT_COMPANY_ACTOR = "sourabhbgp/linkedin-company-scraper"
const DEFAULT_JOBS_ACTOR = "kaix/linkedin-jobs-scraper"
const MAX_JOBS = 25

export function isApifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN?.trim())
}

function getClient(): ApifyClient {
  const token = process.env.APIFY_TOKEN?.trim()
  if (!token) {
    throw new Error("APIFY_TOKEN is not configured")
  }
  return new ApifyClient({ token })
}

function companyActorId(): string {
  return process.env.APIFY_LINKEDIN_COMPANY_ACTOR_ID?.trim() || DEFAULT_COMPANY_ACTOR
}

function jobsActorId(): string {
  return process.env.APIFY_LINKEDIN_JOBS_ACTOR_ID?.trim() || DEFAULT_JOBS_ACTOR
}

export type ApifyCompanyResult = {
  runId: string
  item: Record<string, unknown> | null
  rawItems: unknown[]
}

export type ApifyJobsResult = {
  runId: string
  items: Record<string, unknown>[]
}

/** Scrape a LinkedIn company page. Input: company URL or slug. */
export async function scrapeLinkedInCompany(linkedinUrl: string): Promise<ApifyCompanyResult> {
  const client = getClient()
  const run = await client.actor(companyActorId()).call({
    companies: [linkedinUrl],
    maxResults: 1,
    maxConcurrency: 4,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  const first = (items[0] as Record<string, unknown> | undefined) ?? null

  return {
    runId: run.id,
    item: first,
    rawItems: items,
  }
}

/**
 * Scrape open jobs for a LinkedIn company by numeric company URN/ID.
 * fetchDetails=false keeps cost low (search rows only).
 */
export async function scrapeLinkedInCompanyJobs(companyId: string): Promise<ApifyJobsResult> {
  const client = getClient()
  const run = await client.actor(jobsActorId()).call({
    companyId: String(companyId).replace(/^urn:li:organization:/i, ""),
    maxJobs: MAX_JOBS,
    fetchDetails: false,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  return {
    runId: run.id,
    items: items as Record<string, unknown>[],
  }
}

/** Extract LinkedIn organization URN/ID from company actor output. */
export function extractCompanyUrn(item: Record<string, unknown> | null): string | null {
  if (!item) return null
  const candidates = [
    item.companyUrn,
    item.company_urn,
    item.organizationUrn,
    item.companyId,
    item.company_id,
  ]
  for (const value of candidates) {
    if (value == null) continue
    const raw = String(value).trim()
    if (!raw) continue
    const digits = raw.replace(/^urn:li:organization:/i, "").match(/\d+/)
    if (digits?.[0]) return digits[0]
  }
  return null
}
