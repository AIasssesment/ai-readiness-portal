'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Lock,
  CheckCircle2,
  FileText,
  TrendingUp,
  Target,
  Layers,
  Calendar,
  BarChart3,
  AlertTriangle,
  Map,
  FileBarChart,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAssessmentStore } from '@/lib/assessment-store'
import { useLanguage } from '@/components/language-provider'
import type { TranslationKey } from '@/lib/i18n'
import { ApiClientError } from '@/lib/api/client'
import { createMonobankInvoice, getReportReadiness } from '@/lib/api/payments'

const FEATURE_ICONS = [
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  Layers,
  Calendar,
  FileBarChart,
  AlertTriangle,
  Map,
  FileText,
]

function buildReturnUrl(path: string) {
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export function ExtendedReportUpsell() {
  const { t, locale } = useLanguage()
  const [showCheckout, setShowCheckout] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false)
  const [reportDataReady, setReportDataReady] = useState(false)
  const [missingReasons, setMissingReasons] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const results = useAssessmentStore((state) => state.results)

  const companyName = results?.companyInfo.companyName?.trim()
  const subline = t('extendedUpsell.subline').replace(
    '{company}',
    companyName || t('extendedUpsell.companyFallback'),
  )

  const clientId = results?.savedClientId
  const assessmentId = results?.savedAssessmentId

  useEffect(() => {
    if (!showCheckout) return
    if (!assessmentId) {
      setMissingReasons([])
      setReportDataReady(true)
      return
    }

    let cancelled = false
    setIsCheckingReadiness(true)
    setError(null)

    void getReportReadiness(assessmentId)
      .then((readiness) => {
        if (cancelled) return
        setReportDataReady(readiness.reportDataReady)
        setMissingReasons(readiness.missingReasons ?? [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : t('unlock.readinessFetchFailed'))
      })
      .finally(() => {
        if (cancelled) return
        setIsCheckingReadiness(false)
      })

    return () => {
      cancelled = true
    }
  }, [assessmentId, showCheckout, t])

  const handlePurchase = async () => {
    if (!clientId) {
      setError(t('unlock.clientMissing'))
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const successPath = assessmentId
        ? `/payment/success?assessmentId=${encodeURIComponent(assessmentId)}&returnLocale=${encodeURIComponent(locale)}`
        : `/payment/success?returnLocale=${encodeURIComponent(locale)}`
      const failPath = assessmentId
        ? `/payment/fail?assessmentId=${encodeURIComponent(assessmentId)}&returnLocale=${encodeURIComponent(locale)}`
        : `/payment/fail?returnLocale=${encodeURIComponent(locale)}`

      const invoice = await createMonobankInvoice({
        clientId,
        assessmentId,
        amount: 100,
        currency: 'USD',
        mode: 'charge_and_manual',
        returnUrlSuccess: buildReturnUrl(successPath),
        returnUrlFail: buildReturnUrl(failPath),
      })

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('latest_payment_id', invoice.paymentId)
        if (invoice.reportRequestId) {
          window.localStorage.setItem('latest_report_request_id', invoice.reportRequestId)
        }
      }

      window.location.href = invoice.pageUrl
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        err.status === 409 &&
        err.code === 'REPORT_NOT_READY_BLOCKED'
      ) {
        const details = err.details as { missingReasons?: unknown } | undefined
        if (Array.isArray(details?.missingReasons)) {
          setMissingReasons(details.missingReasons.filter((v): v is string => typeof v === 'string'))
        }
      }
      setError(err instanceof Error ? err.message : t('unlock.paymentFailedDescription'))
    } finally {
      setIsProcessing(false)
    }
  }

  const readinessInfo = useMemo(() => {
    if (isCheckingReadiness) return t('unlock.checkingReadiness')
    if (reportDataReady) return null
    return t('unlock.manualFollowupDescription')
  }, [isCheckingReadiness, reportDataReady, t])

  return (
    <>
      <div className="bg-secondary px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 overflow-hidden rounded-2xl border border-primary/30 bg-background">
            <div className="flex items-center justify-between bg-primary px-6 py-3">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Lock className="h-4 w-4" />
                <span className="font-[family-name:var(--font-syne)] font-bold">{t('extendedUpsell.badge')}</span>
              </div>
              <span className="rounded-full bg-primary-foreground px-3 py-1 text-sm font-bold text-primary">
                {t('extendedUpsell.price')}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              <h3 className="mb-2 font-[family-name:var(--font-syne)] text-2xl font-bold">{t('extendedUpsell.headline')}</h3>
              <p className="mb-8 text-muted-foreground">{subline}</p>

              <div className="mb-8 grid gap-3 sm:grid-cols-2">
                {FEATURE_ICONS.map((Icon, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t(`extendedUpsell.f${i}.title` as TranslationKey)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`extendedUpsell.f${i}.desc` as TranslationKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-y border-border py-4">
                {(['extendedUpsell.value1', 'extendedUpsell.value2', 'extendedUpsell.value3', 'extendedUpsell.value4'] as const).map((key) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{t(key)}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-xl bg-primary px-12 font-[family-name:var(--font-syne)] text-lg font-bold text-primary-foreground hover:bg-primary/90 sm:w-auto"
                  onClick={() => setShowCheckout(true)}
                >
                  {t('extendedUpsell.cta')}
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">{t('extendedUpsell.secureNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-syne)] text-xl">{t('unlock.purchaseTitle')}</DialogTitle>
            <DialogDescription>{t('unlock.purchaseDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3 rounded-xl bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t('unlock.extendedReport')}</span>
                <span className="font-semibold">$29.00</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {t('extendedUpsell.orderFor')} {results?.companyInfo.companyName}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">{t('unlock.total')}</span>
                <span className="text-lg font-bold text-primary">$29.00</span>
              </div>
            </div>

            {readinessInfo ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-muted-foreground">
                {isCheckingReadiness ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{readinessInfo}</span>
                  </div>
                ) : (
                  <p>{readinessInfo}</p>
                )}
              </div>
            ) : null}

            {missingReasons.length > 0 ? (
              <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4">
                <p className="mb-2 text-sm font-medium text-foreground">{t('unlock.missingReasonsTitle')}</p>
                <div className="flex flex-wrap gap-2">
                  {missingReasons.map((reason) => (
                    <Badge key={reason} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button
              className="h-12 w-full rounded-xl bg-primary font-[family-name:var(--font-syne)] text-base font-bold text-primary-foreground hover:bg-primary/90"
              onClick={() => void handlePurchase()}
              disabled={isProcessing || isCheckingReadiness}
            >
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {t('unlock.redirectingToPayment')}
                </>
              ) : (
                <>
                  {t('unlock.completePurchase')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">{t('extendedUpsell.legalFooter')}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
