import { SignJWT, jwtVerify } from "jose"

const OAUTH_STATE_TTL = "10m"

export const LEGACY_OAUTH_COOKIE_NAMES = [
  "oauth_google_state",
  "oauth_google_verifier",
  "oauth_google_next",
] as const

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is not set")
  }
  return new TextEncoder().encode(secret)
}

export type GoogleOAuthStatePayload = {
  verifier: string
  next: string
}

export function safeOAuthNextPath(value: string | null) {
  if (!value || !value.startsWith("/")) return "/portal"
  return value
}

export async function createGoogleOAuthState(
  verifier: string,
  next: string,
): Promise<string> {
  return new SignJWT({ verifier, next })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(OAUTH_STATE_TTL)
    .sign(getSecret())
}

export async function verifyGoogleOAuthState(
  state: string,
): Promise<GoogleOAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(state, getSecret())
    const verifier = payload.verifier
    const next = payload.next
    if (typeof verifier !== "string" || typeof next !== "string") {
      return null
    }
    if (!next.startsWith("/")) {
      return null
    }
    return { verifier, next }
  } catch {
    return null
  }
}

export function clearLegacyOAuthCookies(response: {
  cookies: { delete: (name: string) => void }
}) {
  for (const name of LEGACY_OAUTH_COOKIE_NAMES) {
    response.cookies.delete(name)
  }
}
