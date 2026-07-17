import { sql } from "@/lib/db"

/** Unlock rows in these states count as a completed Job Risk purchase. */
const PAID_UNLOCK_STATUSES = new Set(["paid", "ready"])

export type JobRiskAccess = {
  clientId: string | null
  hasClient: boolean
  linkedin: string | null
  hasLinkedin: boolean
  hasPaid: boolean
  hasExtendedAccess: boolean
  /** Final gate: LinkedIn present AND (paid unlock OR manual extended access). */
  hasAccess: boolean
}

const NO_CLIENT: JobRiskAccess = {
  clientId: null,
  hasClient: false,
  linkedin: null,
  hasLinkedin: false,
  hasPaid: false,
  hasExtendedAccess: false,
  hasAccess: false,
}

export async function getJobRiskAccessByUserId(userId: string): Promise<JobRiskAccess> {
  const clients = await sql<
    Array<{ id: string; linkedin: string | null; has_extended_access: boolean | null }>
  >`
    select id, linkedin, has_extended_access
    from clients
    where user_id = ${userId}
    limit 1
  `
  const client = clients[0]
  if (!client) return NO_CLIENT

  return buildAccess(client)
}

export async function getJobRiskAccessByClientId(clientId: string): Promise<JobRiskAccess> {
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

  return buildAccess(client)
}

async function buildAccess(client: {
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
