'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/components/language-provider'
import { tr } from '@/lib/i18n'
import { LayoutDashboard, LogIn } from 'lucide-react'

interface NavProps {
  onStartAssessment: () => void
}

export function Nav({ onStartAssessment }: NavProps) {
  const { locale } = useLanguage()
  const supabase = useMemo(() => createClient(), [])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [supabase])

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
                  <span className="hidden sm:inline">{tr(locale, 'My Portal', 'Мій портал')}</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="gap-2 rounded-lg">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">{tr(locale, 'Sign In', 'Увійти')}</span>
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <span className="hidden sm:inline">{tr(locale, 'Get Started', 'Почати')}</span>
                    <span className="sm:hidden">{tr(locale, 'Sign up', 'Реєстрація')}</span>
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
          {tr(locale, 'Apply Now', 'Подати заявку')}
        </Button>
      </div>
    </nav>
  )
}
