"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import { swapPublicLocalePath } from "@/lib/locale-path"
import type { Locale } from "@/lib/i18n"

const OPTIONS: Array<{ value: Locale; short: string; flag: string }> = [
  { value: "en", short: "EN", flag: "🇬🇧" },
  { value: "uk", short: "UA", flag: "🇺🇦" },
]

export function useApplyLocale() {
  const { locale, setLocale } = useLanguage()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  return (nextLocale: Locale) => {
    if (nextLocale === locale) return

    setLocale(nextLocale)

    const nextPath = swapPublicLocalePath(pathname, nextLocale)
    if (nextPath) {
      const qs = searchParams.toString()
      router.replace(qs ? `${nextPath}?${qs}` : nextPath)
      return
    }

    router.refresh()
  }
}

export function LocaleToggle({
  className,
  onSwitched,
}: {
  className?: string
  onSwitched?: () => void
}) {
  const { locale, t } = useLanguage()
  const applyLocale = useApplyLocale()
  const activeIndex = OPTIONS.findIndex((option) => option.value === locale)

  return (
    <div
      role="group"
      aria-label={t("settings.language.siteLanguage")}
      className={cn(
        "relative grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/60 p-1",
        className,
      )}
    >
      {/* Sliding highlight */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-background shadow-sm ring-1 ring-border transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {OPTIONS.map((option) => {
        const active = locale === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={t(
              option.value === "en"
                ? "settings.language.option.en"
                : "settings.language.option.uk",
            )}
            onClick={() => {
              applyLocale(option.value)
              onSwitched?.()
            }}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-sm leading-none">{option.flag}</span>
            {option.short}
          </button>
        )
      })}
    </div>
  )
}
