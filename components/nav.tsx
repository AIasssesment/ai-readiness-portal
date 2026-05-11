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
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
    window.addEventListener('portal-auth-changed', checkAuth)
    return () => window.removeEventListener('portal-auth-changed', checkAuth)
  }, [])

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur-xl md:px-12">
      <div className="font-[family-name:var(--font-syne)] text-xl font-extrabold tracking-tight text-primary">
        RPA Community
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {!isCheckingAuth && (
          <>
            {isLoggedIn ? (
              <Link href="/portal">
                <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('nav.myPortal')}</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/auth/login`}>
                  <Button variant="ghost" size="sm" className="gap-2 rounded-lg">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('nav.signIn')}</span>
                  </Button>
                </Link>
                <Link href={`/${locale}/auth/sign-up`}>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <span className="hidden sm:inline">{t('nav.getStarted')}</span>
                    <span className="sm:hidden">{t('nav.signUpShort')}</span>
                  </Button>
                </Link>
              </>
            )}
          </>
        )}
        <Button
          onClick={onStartAssessment}
          className="rounded-lg bg-primary px-4 py-2 font-[family-name:var(--font-syne)] text-sm font-bold text-primary-foreground hover:bg-primary/90 sm:px-5"
        >
          {t('nav.applyNow')}
        </Button>
      </div>
    </nav>
  )
}
