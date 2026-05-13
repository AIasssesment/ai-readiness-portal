import { updateSession } from '@/lib/db-client/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { LOCALE_COOKIE_NAME } from '@/lib/i18n'

function preferredLocaleFromCookie(request: NextRequest): 'en' | 'uk' {
  return request.cookies.get(LOCALE_COOKIE_NAME)?.value === 'uk' ? 'uk' : 'en'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${preferredLocaleFromCookie(request)}`
    return NextResponse.redirect(url)
  }

  const isLocalizedAuth = /^\/(en|uk)\/auth\//.test(pathname)
  if (
    pathname.startsWith('/auth/') &&
    !pathname.startsWith('/auth/callback') &&
    !isLocalizedAuth
  ) {
    const url = request.nextUrl.clone()
    url.pathname = `/${preferredLocaleFromCookie(request)}${pathname}`
    return NextResponse.redirect(url)
  }

  const response = await updateSession(request)

  const localeFromPath = pathname.match(/^\/(en|uk)(?:\/|$)/)
  if (localeFromPath?.[1] === 'en' || localeFromPath?.[1] === 'uk') {
    response.cookies.set(LOCALE_COOKIE_NAME, localeFromPath[1], {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
