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

function normalizeApiBaseUrl(raw: string) {
  const trimmed = raw.trim().replace(/\/$/, "")
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`
}

function resolveApiBaseUrl() {
  const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (publicBase) {
    return normalizeApiBaseUrl(publicBase)
  }

  const serverBase = process.env.API_URL?.trim() || process.env.BACKEND_URL?.trim()
  if (serverBase) {
    return normalizeApiBaseUrl(serverBase)
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/v1`
  }

  throw new Error(
    "API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL (and optionally API_URL/BACKEND_URL for server-side usage).",
  )
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
  const contentType = response.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")

  try {
    if (isJson) {
      payload = await response.json()
    } else {
      const text = await response.text()
      payload = text ? { error: { message: text } } : null
    }
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
      (payload &&
        typeof payload === "object" &&
        typeof (payload as { error?: { message?: unknown } }).error?.message === "string" &&
        (payload as { error: { message: string } }).error.message) ||
        `Request failed with status ${response.status}`,
    )
  }

  return payload as T
}
