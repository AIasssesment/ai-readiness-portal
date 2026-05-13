import { createRemoteJWKSet, jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/auth/session"
import { sql } from "@/lib/db"
import { LOCALE_COOKIE_NAME } from "@/lib/i18n"

const OAUTH_STATE_COOKIE = "oauth_google_state"
const OAUTH_VERIFIER_COOKIE = "oauth_google_verifier"
const OAUTH_NEXT_COOKIE = "oauth_google_next"

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"))

type GoogleIdTokenClaims = {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
}

function loginRedirect(request: NextRequest, reason: string) {
  const locale = request.cookies.get(LOCALE_COOKIE_NAME)?.value === "uk" ? "uk" : "en"
  return NextResponse.redirect(`${request.nextUrl.origin}/${locale}/auth/login?oauth_error=${reason}`)
}

async function fetchGoogleTokens(code: string, redirectUri: string, codeVerifier: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth env vars are not configured")
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text()
    throw new Error(`Token exchange failed: ${details}`)
  }

  return (await tokenResponse.json()) as { id_token?: string }
}

async function verifyGoogleIdToken(idToken: string, audience: string) {
  const { payload } = await jwtVerify(idToken, googleJwks, {
    audience,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  })

  const claims = payload as unknown as GoogleIdTokenClaims
  if (!claims.sub || !claims.email) {
    throw new Error("Google token is missing required claims")
  }
  if (claims.email_verified === false) {
    throw new Error("Google email is not verified")
  }
  return claims
}

async function ensureUserAndIdentity(claims: GoogleIdTokenClaims) {
  return sql.begin(async (tx) => {
    const identityRows = await tx<Array<{ user_id: string }>>`
      select user_id
      from auth_identities
      where provider = 'google'
        and provider_user_id = ${claims.sub}
      limit 1
    `

    let userId = identityRows[0]?.user_id
    if (!userId) {
      const existingUser = await tx<Array<{ id: string }>>`
        select id
        from app_users
        where lower(email) = lower(${claims.email})
        limit 1
      `
      if (existingUser[0]) {
        userId = existingUser[0].id
      } else {
        const createdUsers = await tx<Array<{ id: string }>>`
          insert into app_users (email, full_name)
          values (${claims.email}, ${claims.name ?? null})
          returning id
        `
        userId = createdUsers[0]?.id
      }
    }

    await tx`
      insert into auth_identities (user_id, provider, provider_user_id, email)
      values (${userId}, 'google', ${claims.sub}, ${claims.email})
      on conflict (provider, provider_user_id)
      do update set email = excluded.email
    `

    const existingClient = await tx<Array<{ id: string }>>`
      select id
      from clients
      where user_id = ${userId}
      limit 1
    `
    if (!existingClient[0]) {
      await tx`
        insert into clients (user_id, company_name, contact_name, contact_email)
        values (${userId}, ${claims.name ?? "New Company"}, ${claims.name ?? null}, ${claims.email})
      `
    }

    return { id: userId, email: claims.email }
  })
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  if (error) return loginRedirect(request, "google_denied")
  if (!code || !state) return loginRedirect(request, "missing_code")

  const savedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value
  const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value
  const nextPath = request.cookies.get(OAUTH_NEXT_COOKIE)?.value || "/portal"
  if (!savedState || !verifier || savedState !== state) {
    return loginRedirect(request, "invalid_state")
  }

  try {
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? `${request.nextUrl.origin}/api/auth/google/callback`
    const tokens = await fetchGoogleTokens(code, redirectUri, verifier)
    if (!tokens.id_token) {
      return loginRedirect(request, "missing_token")
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return loginRedirect(request, "missing_client_id")
    }
    const claims = await verifyGoogleIdToken(tokens.id_token, clientId)
    const user = await ensureUserAndIdentity(claims)
    await createSession(user)

    const response = NextResponse.redirect(`${request.nextUrl.origin}${nextPath}`)
    response.cookies.delete(OAUTH_STATE_COOKIE)
    response.cookies.delete(OAUTH_VERIFIER_COOKIE)
    response.cookies.delete(OAUTH_NEXT_COOKIE)
    return response
  } catch (e) {
    console.error("google oauth callback error", e)
    return loginRedirect(request, "oauth_failed")
  }
}
