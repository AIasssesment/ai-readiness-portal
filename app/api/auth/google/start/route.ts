import { randomBytes, createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import {
  clearLegacyOAuthCookies,
  createGoogleOAuthState,
  safeOAuthNextPath,
} from "@/lib/auth/google-oauth-state"
import { apiErrors } from "@/lib/http/api-errors"

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

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return apiErrors.internal("GOOGLE_CLIENT_ID is not set")
  }

  const url = new URL(request.url)
  const nextPath = safeOAuthNextPath(url.searchParams.get("next"))
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${url.origin}/api/auth/google/callback`

  const verifier = makeCodeVerifier()
  const challenge = makeCodeChallenge(verifier)
  const state = await createGoogleOAuthState(verifier, nextPath)

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
  clearLegacyOAuthCookies(response)
  return response
}
