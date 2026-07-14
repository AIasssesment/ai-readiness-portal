'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { LayoutDashboard, LogIn } from 'lucide-react'

interface NavProps {
  onStartAssessment: () => void
}

export function Nav({ onStartAssessment }: NavProps) {
  const { locale, t } = useLanguage()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = (await res.json()) as { user?: unknown }
        setIsLoggedIn(!!data.user)
      } catch {
        setIsLoggedIn(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    void checkAuth()
    window.addEventListener('portal-auth-changed', checkAuth)
    return () => window.removeEventListener('portal-auth-changed', checkAuth)
  }, [])

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4 md:px-12">
      <div className="min-w-0 truncate font-[family-name:var(--font-syne)] text-base font-extrabold tracking-tight text-primary sm:text-xl">
        RPA Community
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {!isCheckingAuth && (
          <>
            {isLoggedIn ? (
              <Link href="/portal">
                <Button variant="outline" size="sm" className="gap-2 rounded-lg px-2.5 sm:px-3">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('nav.myPortal')}</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/auth/login`}>
                  <Button variant="ghost" size="sm" className="gap-2 rounded-lg px-2.5 sm:px-3">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('nav.signIn')}</span>
                  </Button>
                </Link>
                {/* Full sign-up CTA only from sm — on phones it crowded out Apply */}
                <Link href={`/${locale}/auth/sign-up`} className="hidden sm:inline-flex">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              </>
            )}
          </>
        )}
        <Button
          onClick={onStartAssessment}
          className="rounded-lg bg-primary px-3 py-2 font-[family-name:var(--font-syne)] text-sm font-bold text-primary-foreground hover:bg-primary/90 sm:px-5"
        >
          <span className="sm:hidden">{t('nav.applyNowShort')}</span>
          <span className="hidden sm:inline">{t('nav.applyNow')}</span>
        </Button>
      </div>
    </nav>
  )
}
