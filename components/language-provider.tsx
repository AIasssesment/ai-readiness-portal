"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { LOCALE_COOKIE_NAME, type Locale, type TranslationKey, t as translate } from "@/lib/i18n"

type LanguageContextValue = {
  locale: Locale
  setLocale: (nextLocale: Locale) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = nextLocale
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: TranslationKey) => translate(locale, key),
    }),
    [locale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
