/** Тіло помилки з `apiErrors` або сумісний формат з рядком `error`. */
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
