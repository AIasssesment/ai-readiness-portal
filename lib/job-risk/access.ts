import "server-only"

import { fetchJobRiskAccess, type JobRiskAccess } from "@/lib/api/job-risk"
import { resolveClientIdForUser } from "@/lib/api/resolve-client"
import { sql } from "@/lib/db"

export type { JobRiskAccess }

/** Unlock rows in these states count as a completed Job Risk purchase. */
const PAID_UNLOCK_STATUSES = new Set(["paid", "ready"])

const NO_CLIENT: JobRiskAccess = {
  clientId: null,
  hasClient: false,
  linkedin: null,
  hasLinkedin: false,
  hasPaid: false,
  hasExtendedAccess: false,
  hasAccess: false,
}

function canCallNestBackend() {
  const hasToken = Boolean(process.env.INTERNAL_API_TOKEN?.trim())
  const hasBase = Boolean(
    process.env.API_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim(),
  )
  return hasToken && hasBase
}

async function buildAccessFromSql(client: {
  id: string
  linkedin: string | null
  has_extended_access: boolean | null
}): Promise<JobRiskAccess> {
  const unlocks = await sql<Array<{ status: string }>>`
    select status from job_risk_unlocks where client_id = ${client.id}::uuid limit 1
  `
  const hasPaid = unlocks.some((row) => PAID_UNLOCK_STATUSES.has(row.status))
  const hasExtendedAccess = Boolean(client.has_extended_access)
  const linkedin = client.linkedin?.trim() || null
  const hasLinkedin = Boolean(linkedin)

  return {
    clientId: client.id,
    hasClient: true,
    linkedin,
    hasLinkedin,
    hasPaid,
    hasExtendedAccess,
    hasAccess: hasLinkedin && (hasPaid || hasExtendedAccess),
  }
}

async function getJobRiskAccessByClientIdFromSql(clientId: string): Promise<JobRiskAccess> {
  const clients = await sql<
    Array<{ id: string; linkedin: string | null; has_extended_access: boolean | null }>
  >`
    select id, linkedin, has_extended_access
    from clients
    where id = ${clientId}::uuid
    limit 1
  `
  const client = clients[0]
  if (!client) return NO_CLIENT
  return buildAccessFromSql(client)
}

/**
 * Prefer Nest access gate; fall back to Neon SQL when Nest is unreachable,
 * not yet deployed, or BFF env is missing (avoids production 500s).
 */
export async function getJobRiskAccessByUserId(userId: string): Promise<JobRiskAccess> {
  const clientId = await resolveClientIdForUser(userId)
  if (!clientId) return NO_CLIENT

  if (canCallNestBackend()) {
    try {
      return await fetchJobRiskAccess(clientId)
    } catch (error) {
      console.error("Nest job-risk access failed; falling back to SQL", error)
    }
  }

  return getJobRiskAccessByClientIdFromSql(clientId)
}

export async function getJobRiskAccessByClientId(clientId: string): Promise<JobRiskAccess> {
  if (canCallNestBackend()) {
    try {
      return await fetchJobRiskAccess(clientId)
    } catch (error) {
      console.error("Nest job-risk access failed; falling back to SQL", error)
    }
  }
  return getJobRiskAccessByClientIdFromSql(clientId)
}
