import { NextRequest, NextResponse } from 'next/server'
import { LOCALE_COOKIE_NAME } from '@/lib/i18n'

export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl
  const locale = request.cookies.get(LOCALE_COOKIE_NAME)?.value === 'uk' ? 'uk' : 'en'
  return NextResponse.redirect(`${origin}/${locale}/auth/login`)
}
