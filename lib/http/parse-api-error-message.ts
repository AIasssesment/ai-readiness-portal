/** Parse API JSON error body: top-level `error` string or `{ message }` object. */
export function parseApiErrorMessage(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined
  const raw = (json as { error?: unknown }).error
  if (typeof raw === "string") return raw
  if (raw && typeof raw === "object" && "message" in raw) {
    const msg = (raw as { message?: unknown }).message
    if (typeof msg === "string") return msg
  }
  return undefined
}
