import { createRemoteJWKSet, jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/auth/session"
import { sql } from "@/lib/db"
import { LOCALE_COOKIE_NAME } from "@/lib/i18n"

const OAUTH_STATE_COOKIE = "oauth_google_state"
const OAUTH_VERIFIER_COOKIE = "oauth_google_verifier"
const OAUTH_NEXT_COOKIE = "oauth_google_next"

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"))

function oauthLog(step: string, data?: Record<string, unknown>) {
  console.log("[google-oauth]", step, data ? JSON.stringify(data) : "")
}

type GoogleIdTokenClaims = {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
}

function loginRedirect(request: NextRequest, reason: string) {
  oauthLog("redirect_login", { reason })
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
    oauthLog("token_exchange_http_error", {
      status: tokenResponse.status,
      detailsPreview: details.slice(0, 400),
    })
    throw new Error(`Token exchange failed: ${details}`)
  }

  const json = (await tokenResponse.json()) as { id_token?: string }
  oauthLog("token_exchange_ok", { hasIdToken: Boolean(json.id_token) })
  return json
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
    let userSource: "existing_google_identity" | "existing_email" | "new_app_user" | "unknown" = "unknown"

    if (userId) {
      userSource = "existing_google_identity"
      oauthLog("db_identity_hit", { userId, email: claims.email })
    }

    if (!userId) {
      const existingUser = await tx<Array<{ id: string }>>`
        select id
        from app_users
        where lower(email) = lower(${claims.email})
        limit 1
      `
      if (existingUser[0]) {
        userId = existingUser[0].id
        userSource = "existing_email"
        oauthLog("db_user_by_email", { userId, email: claims.email })
      } else {
        const createdUsers = await tx<Array<{ id: string }>>`
          insert into app_users (email, full_name)
          values (${claims.email}, ${claims.name ?? null})
          returning id
        `
        userId = createdUsers[0]?.id
        userSource = "new_app_user"
        oauthLog("db_user_inserted", { userId: userId ?? null, email: claims.email })
      }
    }

    if (!userId) {
      oauthLog("db_fatal_no_user_id", { email: claims.email, userSource })
      throw new Error("Failed to resolve user id after Google sign-in")
    }

    await tx`
      insert into auth_identities (user_id, provider, provider_user_id, email)
      values (${userId}, 'google', ${claims.sub}, ${claims.email})
      on conflict (provider, provider_user_id)
      do update set email = excluded.email
    `
    oauthLog("db_auth_identity_upserted", { userId, googleSub: claims.sub })

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
      oauthLog("db_client_inserted", { userId })
    } else {
      oauthLog("db_client_exists", { userId, clientId: existingClient[0].id })
    }

    oauthLog("ensure_user_done", { userId, email: claims.email, userSource })
    return { id: userId, email: claims.email }
  })
}

export async function GET(request: NextRequest) {
  oauthLog("callback_hit", {
    origin: request.nextUrl.origin,
    hasCode: Boolean(request.nextUrl.searchParams.get("code")),
    hasState: Boolean(request.nextUrl.searchParams.get("state")),
  })

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  if (error) return loginRedirect(request, "google_denied")
  if (!code || !state) return loginRedirect(request, "missing_code")

  const savedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value
  const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value
  const nextPath = request.cookies.get(OAUTH_NEXT_COOKIE)?.value || "/portal"
  oauthLog("callback_cookies", {
    hasSavedState: Boolean(savedState),
    hasVerifier: Boolean(verifier),
    stateMatch: Boolean(savedState && state && savedState === state),
    nextPath,
  })

  if (!savedState || !verifier || savedState !== state) {
    return loginRedirect(request, "invalid_state")
  }

  try {
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? `${request.nextUrl.origin}/api/auth/google/callback`
    oauthLog("callback_try", {
      redirectUriHost: new URL(redirectUri).host,
      usingEnvRedirectUri: Boolean(process.env.GOOGLE_REDIRECT_URI),
    })

    const tokens = await fetchGoogleTokens(code, redirectUri, verifier)
    if (!tokens.id_token) {
      oauthLog("callback_abort", { reason: "missing_id_token" })
      return loginRedirect(request, "missing_token")
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return loginRedirect(request, "missing_client_id")
    }
    const claims = await verifyGoogleIdToken(tokens.id_token, clientId)
    oauthLog("id_token_ok", {
      email: claims.email,
      emailVerified: claims.email_verified !== false,
      hasSub: Boolean(claims.sub),
    })

    const user = await ensureUserAndIdentity(claims)
    await createSession(user)
    oauthLog("session_created", { userId: user.id, email: user.email })

    const redirectTo = `${request.nextUrl.origin}${nextPath}`
    oauthLog("callback_success_redirect", { redirectTo })
    const response = NextResponse.redirect(redirectTo)
    response.cookies.delete(OAUTH_STATE_COOKIE)
    response.cookies.delete(OAUTH_VERIFIER_COOKIE)
    response.cookies.delete(OAUTH_NEXT_COOKIE)
    return response
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    oauthLog("callback_catch", { message: message.slice(0, 500) })
    console.error("google oauth callback error", e)
    return loginRedirect(request, "oauth_failed")
  }
}
