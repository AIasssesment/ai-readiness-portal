import type { Locale } from "@/lib/i18n"

export const PUBLIC_LOCALES = ["en", "uk"] as const satisfies readonly Locale[]

export type PublicLocale = (typeof PUBLIC_LOCALES)[number]

export function isPublicLocale(value: string | null | undefined): value is PublicLocale {
  return value === "en" || value === "uk"
}

export function localizedAuthPath(locale: Locale, authPath: string): string {
  const path = authPath.startsWith("/") ? authPath : `/${authPath}`
  if (!path.startsWith("/auth/")) return path
  if (path.startsWith("/auth/callback")) return path
  return `/${locale}${path}`
}

export function localizedHomePath(locale: Locale): string {
  return `/${locale}`
}

/**
 * Swap `/en` or `/uk` prefix when present.
 * Returns null for cookie-only routes (`/portal`, `/payment`, …) where the URL stays unchanged.
 */
export function swapPublicLocalePath(pathname: string, nextLocale: Locale): string | null {
  if (!/^\/(en|uk)(?=\/|$)/.test(pathname)) return null
  return pathname.replace(/^\/(en|uk)/, `/${nextLocale}`)
}
