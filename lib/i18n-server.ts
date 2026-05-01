import "server-only"
import { cookies } from "next/headers"
import { LOCALE_COOKIE_NAME, isLocale, type Locale } from "@/lib/i18n"

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const localeFromCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  return isLocale(localeFromCookie) ? localeFromCookie : "en"
}
