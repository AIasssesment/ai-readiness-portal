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
import {
  beginPaymentFlow,
  buildPaymentFailPath,
  buildPaymentSuccessPath,
  preparePaymentWindow,
} from '@/lib/payment-flow'

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
  const [showMonoConfirm, setShowMonoConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false)
  const [reportDataReady, setReportDataReady] = useState(false)
  const [missingReasons, setMissingReasons] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const results = useAssessmentStore((state) => state.results)

  const companyName = results?.companyInfo.companyName?.trim()
  const subline = t('extendedUpsell.subline').replace(
    '{company}',
    companyName || t('extendedUpsell.companyFallback'),
  )

  const clientId = results?.savedClientId
  const assessmentId = results?.savedAssessmentId
  const monoTitle = locale === 'uk' ? 'Рекомендуємо такий варіант:' : 'Recommended payment option:'
  const monoButtonLabel = locale === 'uk' ? 'Онлайн-оплата карткою' : 'Online card payment'
  const monoBrand = 'plata by mono'
  const backLabel = locale === 'uk' ? 'Назад' : 'Back'

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
    void checkAuth()
    window.addEventListener('portal-auth-changed', checkAuth)
    return () => window.removeEventListener('portal-auth-changed', checkAuth)
  }, [])

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

  const handlePurchase = async (paymentWindow?: Window | null) => {
    if (!clientId) {
      setError(t('unlock.clientMissing'))
      return
    }

    setIsProcessing(true)
    setError(null)
    setPaymentNotice(null)

    try {
      const successPath = buildPaymentSuccessPath(locale, assessmentId)
      const failPath = buildPaymentFailPath(locale, assessmentId, isLoggedIn)

      const invoice = await createMonobankInvoice({
        clientId,
        assessmentId,
        amount: 2900,
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

      if (!invoice.pageUrl) {
        paymentWindow?.close()
        setError(t('unlock.paymentFailedDescription'))
        return
      }

      const launch = beginPaymentFlow({
        pageUrl: invoice.pageUrl,
        reportRequestId: invoice.reportRequestId,
        assessmentId,
        locale,
        isLoggedIn,
        paymentWindow,
      })

      if (launch.popupBlocked) {
        setError(t('unlock.popupBlocked'))
        return
      }

      setShowCheckout(false)
      setShowMonoConfirm(false)

      if (launch.mode === 'new_tab') {
        setPaymentNotice(t('unlock.paymentTabOpened'))
      }
    } catch (err) {
      paymentWindow?.close()
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
      {paymentNotice ? (
        <div className="border-b border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm text-foreground">
          {paymentNotice}
        </div>
      ) : null}

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
              onClick={() => setShowMonoConfirm(true)}
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

      <Dialog open={showMonoConfirm} onOpenChange={setShowMonoConfirm}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-syne)] text-xl">{monoTitle}</DialogTitle>
            <DialogDescription>{t('unlock.purchaseDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full border-2 border-foreground" />
                  <span className="font-medium">{monoButtonLabel}</span>
                </div>
                <span className="rounded-md bg-foreground px-3 py-1 text-sm font-semibold text-background">
                  {monoBrand}
                </span>
              </div>
            </div>
            <Button
              className="h-12 w-full rounded-xl bg-primary font-[family-name:var(--font-syne)] text-base font-bold text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                const paymentWindow = preparePaymentWindow()
                setShowMonoConfirm(false)
                void handlePurchase(paymentWindow)
              }}
              disabled={isProcessing || isCheckingReadiness}
            >
              {isProcessing ? t('unlock.redirectingToPayment') : monoButtonLabel}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={() => setShowMonoConfirm(false)}
              disabled={isProcessing}
            >
              {backLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
