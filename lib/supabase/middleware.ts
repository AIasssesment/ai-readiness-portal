import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from "jose"
import { LOCALE_COOKIE_NAME } from "@/lib/i18n"

const SESSION_COOKIE = "app_session"

function loginPath(request: NextRequest): string {
  const locale = request.cookies.get(LOCALE_COOKIE_NAME)?.value === "uk" ? "uk" : "en"
  return `/${locale}/auth/login`
}

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is not set")
  }
  return new TextEncoder().encode(secret)
}

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  let user: string | null = null
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret())
      user = String(payload.sub ?? "")
    } catch {
      user = null
    }
  }

  // Protect /protected and /portal routes
  if (
    (request.nextUrl.pathname.startsWith('/protected') ||
     request.nextUrl.pathname.startsWith('/portal')) &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = loginPath(request)
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}
