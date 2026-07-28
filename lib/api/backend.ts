import "server-only"

import { apiFetch } from "@/lib/api/client"
import { getSessionUserRole } from "@/lib/auth/admin"
import { getSessionUser } from "@/lib/auth/session"

export type BackendFetchInit = RequestInit & {
  /** Override session user id. Pass null to omit X-User-Id. */
  userId?: string | null
  /** Override role. Pass null to omit X-User-Role. */
  userRole?: string | null
  /** clients.id for the acting user/tenant when known. */
  clientId?: string | null
  /**
   * Health/readiness probes that do not need identity headers.
   * Still sends Authorization: Bearer INTERNAL_API_TOKEN.
   */
  skipIdentityHeaders?: boolean
}

function getInternalApiToken() {
  const token = process.env.INTERNAL_API_TOKEN?.trim()
  if (!token) {
    throw new Error("INTERNAL_API_TOKEN is not set")
  }
  return token
}

function mergeHeaders(
  base: Record<string, string>,
  extra?: HeadersInit,
): Record<string, string> {
  const merged: Record<string, string> = { ...base }
  if (!extra) return merged

  if (extra instanceof Headers) {
    extra.forEach((value, key) => {
      merged[key] = value
    })
    return merged
  }

  if (Array.isArray(extra)) {
    for (const [key, value] of extra) {
      merged[key] = value
    }
    return merged
  }

  for (const [key, value] of Object.entries(extra)) {
    if (typeof value === "string") {
      merged[key] = value
    }
  }
  return merged
}

/**
 * Server-only Nest client for BFF Route Handlers / Server Components.
 * Attaches INTERNAL_API_TOKEN and trusted identity headers.
 * Never import this module from Client Components.
 */
export async function backendFetch<T>(path: string, init: BackendFetchInit = {}): Promise<T> {
  const {
    userId: userIdOverride,
    userRole: userRoleOverride,
    clientId,
    skipIdentityHeaders = false,
    headers: initHeaders,
    ...rest
  } = init

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getInternalApiToken()}`,
  }

  if (!skipIdentityHeaders) {
    let userId = userIdOverride
    let userRole = userRoleOverride

    if (userId === undefined || userRole === undefined) {
      const user = await getSessionUser()
      if (userId === undefined) {
        userId = user?.id ?? null
      }
      if (userRole === undefined) {
        userRole = user ? ((await getSessionUserRole()) ?? "user") : null
      }
    }

    if (userId) {
      headers["X-User-Id"] = userId
    }
    if (userRole) {
      headers["X-User-Role"] = userRole
    }
    if (clientId) {
      headers["X-Client-Id"] = clientId
    }
  }

  return apiFetch<T>(path, {
    ...rest,
    headers: mergeHeaders(headers, initHeaders),
  })
}

/** Smoke helper for Phase 0 / local checks. Does not require a session. */
export async function backendHealthLive() {
  return backendFetch<{ status: string }>("/health/live", {
    method: "GET",
    skipIdentityHeaders: true,
  })
}
