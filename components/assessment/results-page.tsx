'use client'

import { useEffect, useState } from 'react'
import { RefreshCcw, LayoutDashboard, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAssessmentStore } from '@/lib/assessment-store'
import { BasicResults } from './basic-results'
import { ExtendedReportUpsell } from './extended-report-upsell'
import { ExtendedReport } from './extended-report'
import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'

export function ResultsPage() {
  const { locale } = useLanguage()
  const { hasPurchasedExtended, reset, results, purchaseExtendedReport } = useAssessmentStore()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = (await res.json()) as { user?: unknown }
        setIsLoggedIn(!!data.user)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
    window.addEventListener('portal-auth-changed', checkAuth)
    return () => window.removeEventListener('portal-auth-changed', checkAuth)
  }, [])
  const paymentTestMode = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === 'true'

  useEffect(() => {
    if (!paymentTestMode || hasPurchasedExtended || !results?.savedAssessmentId || typeof document === 'undefined') return

    const key = 'test_paid_assessment_ids'
    const raw = document.cookie
      .split('; ')
      .find((part) => part.startsWith(`${key}=`))
      ?.split('=')[1]
    const decoded = raw ? decodeURIComponent(raw) : ''
    const paidIds = decoded
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (paidIds.includes(results.savedAssessmentId)) {
      purchaseExtendedReport()
    }
  }, [hasPurchasedExtended, paymentTestMode, purchaseExtendedReport, results?.savedAssessmentId])

  return (
    <div className="space-y-8">
      {/* Portal Access Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {isLoggedIn ? 'Results Saved to Your Portal' : 'Save Your Results'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isLoggedIn 
                    ? 'Access your dashboard to track progress and view opportunities'
                    : 'Sign in to save results and track your AI journey over time'}
                </p>
              </div>
            </div>
            {isLoggedIn ? (
              <Link href="/portal">
                <Button className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Portal
                </Button>
              </Link>
            ) : (
              <Link href={`/${locale}/auth/sign-up`}>
                <Button className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Results - Always shown */}
      <BasicResults />

      {/* Extended Report Section */}
      {hasPurchasedExtended ? (
        <ExtendedReport />
      ) : (
        <ExtendedReportUpsell />
      )}

      {/* Reset Button */}
      <div className="text-center pt-4">
        <Button variant="ghost" onClick={reset} className="gap-2 text-muted-foreground">
          <RefreshCcw className="h-4 w-4" />
          Start New Assessment
        </Button>
      </div>
    </div>
  )
}
