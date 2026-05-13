import type { ApiErrorResponse } from "@/lib/api/types"

export class ApiClientError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.code = code
    this.details = details
  }
}

function resolveApiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (base) {
    return `${base.replace(/\/$/, "")}/v1`
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/v1`
  }
  return "/v1"
}

function parseApiError(payload: unknown): ApiErrorResponse["error"] | null {
  if (!payload || typeof payload !== "object") return null
  const error = (payload as { error?: unknown }).error
  if (!error || typeof error !== "object") return null

  const code = (error as { code?: unknown }).code
  const message = (error as { message?: unknown }).message
  const details = (error as { details?: unknown }).details

  if (typeof code !== "string" || typeof message !== "string") return null

  return {
    code,
    message,
    details: details && typeof details === "object" ? (details as Record<string, unknown>) : undefined,
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const parsed = parseApiError(payload)
    if (parsed) {
      throw new ApiClientError(response.status, parsed.code, parsed.message, parsed.details)
    }

    throw new ApiClientError(
      response.status,
      "UNKNOWN_API_ERROR",
      `Request failed with status ${response.status}`,
    )
  }

  return payload as T
}
