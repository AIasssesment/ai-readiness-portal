import "server-only"

import { fetchJobRiskAccess, type JobRiskAccess } from "@/lib/api/job-risk"
import { resolveClientIdForUser } from "@/lib/api/resolve-client"

export type { JobRiskAccess }

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
  const clientId = await resolveClientIdForUser(userId)
  if (!clientId) return NO_CLIENT
  return fetchJobRiskAccess(clientId)
}

export async function getJobRiskAccessByClientId(clientId: string): Promise<JobRiskAccess> {
  return fetchJobRiskAccess(clientId)
}
