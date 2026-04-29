import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from "jose"

const SESSION_COOKIE = "app_session"

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
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}
