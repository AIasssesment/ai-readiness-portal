import { randomBytes, createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

const OAUTH_STATE_COOKIE = "oauth_google_state"
const OAUTH_VERIFIER_COOKIE = "oauth_google_verifier"
const OAUTH_NEXT_COOKIE = "oauth_google_next"
const OAUTH_MAX_AGE_SECONDS = 60 * 10

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function makeCodeVerifier() {
  return base64Url(randomBytes(64))
}

function makeCodeChallenge(verifier: string) {
  const digest = createHash("sha256").update(verifier).digest()
  return base64Url(digest)
}

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/")) return "/portal"
  return value
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID is not set" }, { status: 500 })
  }

  const url = new URL(request.url)
  const nextPath = safeNextPath(url.searchParams.get("next"))
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${url.origin}/api/auth/google/callback`

  const state = base64Url(randomBytes(32))
  const verifier = makeCodeVerifier()
  const challenge = makeCodeChallenge(verifier)

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("code_challenge", challenge)
  authUrl.searchParams.set("code_challenge_method", "S256")
  authUrl.searchParams.set("prompt", "select_account")

  const response = NextResponse.redirect(authUrl)
  const secure = process.env.NODE_ENV === "production"

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_MAX_AGE_SECONDS,
  })
  response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_MAX_AGE_SECONDS,
  })
  response.cookies.set(OAUTH_NEXT_COOKIE, nextPath, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_MAX_AGE_SECONDS,
  })

  return response
}
