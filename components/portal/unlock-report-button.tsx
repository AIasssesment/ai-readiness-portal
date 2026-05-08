"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowRight, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { ApiClientError } from "@/lib/api/client"
import {
  createMonobankInvoice,
  getReportReadiness,
  storeLatestReportRequestId,
} from "@/lib/api/payments"
import type { PaymentMode, ReportReadinessResponse } from "@/lib/api/types"

type UnlockReportButtonProps = {
  label?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  clientId?: string
  assessmentId?: string
  amount?: number
  currency?: string
  mode?: PaymentMode
  returnUrlSuccess?: string
  returnUrlFail?: string
  simulatePaymentFailure?: boolean
}

type PurchasePhase = "checkout" | "insufficient_block" | "manual_followup_hint" | "payment_error"

function buildReturnUrl(path: string) {
  if (typeof window === "undefined") return path
  return `${window.location.origin}${path}`
}

function toMissingReasons(readiness: ReportReadinessResponse | null, fallback?: unknown): string[] {
  const fromReadiness = readiness?.missingReasons ?? []
  if (fromReadiness.length > 0) return fromReadiness

  const maybeArray = (fallback as { missingReasons?: unknown })?.missingReasons
  if (!Array.isArray(maybeArray)) return []
  return maybeArray.filter((v): v is string => typeof v === "string")
}

function logBreadcrumb(event: string, payload: Record<string, unknown>) {
  console.info(`[payments] ${event}`, payload)
}

export function UnlockReportButton({
  label,
  className,
  variant = "outline",
  clientId,
  assessmentId,
  amount = 2900,
  currency = "USD",
  mode = "charge_and_manual",
  returnUrlSuccess,
  returnUrlFail,
  simulatePaymentFailure = false,
}: UnlockReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<PurchasePhase>("checkout")
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMonoConfirmOpen, setIsMonoConfirmOpen] = useState(false)
  const [readiness, setReadiness] = useState<ReportReadinessResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [missingReasons, setMissingReasons] = useState<string[]>([])
  const { t, locale } = useLanguage()
  const resolvedLabel = label ?? t("unlock.fullReport")
  const monoTitle = locale === "uk" ? "Рекомендуємо такий варіант:" : "Recommended payment option:"
  const monoButtonLabel = locale === "uk" ? "Онлайн-оплата карткою" : "Online card payment"
  const monoBrand = "plata by mono"
  const backLabel = locale === "uk" ? "Назад" : "Back"

  const reportReady = readiness?.reportDataReady ?? false

  useEffect(() => {
    if (!open) return

    if (!assessmentId) {
      setReadiness(null)
      setMissingReasons([])
      setPhase("checkout")
      return
    }

    let cancelled = false
    setIsCheckingReadiness(true)
    setErrorMessage(null)

    void getReportReadiness(assessmentId)
      .then((response) => {
        if (cancelled) return
        setReadiness(response)
        const reasons = response.missingReasons ?? []
        setMissingReasons(reasons)

        if (!response.reportDataReady && mode === "block") {
          setPhase("insufficient_block")
        } else if (!response.reportDataReady && mode === "charge_and_manual") {
          setPhase("manual_followup_hint")
        } else {
          setPhase("checkout")
        }

        logBreadcrumb("readiness_loaded", {
          assessmentId,
          reportDataReady: response.reportDataReady,
          missingReasonsCount: reasons.length,
        })
      })
      .catch((error) => {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : "Failed to load readiness")
      })
      .finally(() => {
        if (cancelled) return
        setIsCheckingReadiness(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, assessmentId, mode])

  const canPay = useMemo(() => {
    if (mode === "block" && !reportReady) return false
    return true
  }, [mode, reportReady])

  const handleCloseDialog = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setPhase("checkout")
    }
  }

  const handleCreateInvoice = async () => {
    if (!clientId) {
      setPhase("payment_error")
      setErrorMessage(t("unlock.clientMissing"))
      return
    }

    if (mode === "block" && !reportReady) {
      setPhase("insufficient_block")
      return
    }

    if (simulatePaymentFailure) {
      setPhase("payment_error")
      setErrorMessage(t("unlock.paymentFailedDescription"))
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const successPath = assessmentId
        ? `/payment/success?assessmentId=${encodeURIComponent(assessmentId)}&returnLocale=${encodeURIComponent(locale)}`
        : `/payment/success?returnLocale=${encodeURIComponent(locale)}`
      const failPath = assessmentId
        ? `/payment/fail?assessmentId=${encodeURIComponent(assessmentId)}&returnLocale=${encodeURIComponent(locale)}`
        : `/payment/fail?returnLocale=${encodeURIComponent(locale)}`
      const successUrl = returnUrlSuccess ?? buildReturnUrl(successPath)
      const failUrl = returnUrlFail ?? buildReturnUrl(failPath)

      const response = await createMonobankInvoice({
        clientId,
        assessmentId,
        amount,
        currency,
        mode,
        returnUrlSuccess: successUrl,
        returnUrlFail: failUrl,
      })

      storeLatestReportRequestId(response.reportRequestId)

      if (typeof window !== "undefined") {
        if (response.paymentId) {
          window.localStorage.setItem("latest_payment_id", response.paymentId)
        }
        if (response.reportRequestId) {
          window.localStorage.setItem("latest_report_request_id", response.reportRequestId)
        }
      }

      logBreadcrumb("invoice_created", {
        paymentId: response.paymentId,
        invoiceId: response.invoiceId,
        hasPageUrl: Boolean(response.pageUrl),
      })

      window.location.href = response.pageUrl
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.status === 409 &&
        error.code === "REPORT_NOT_READY_BLOCKED"
      ) {
        setPhase("insufficient_block")
        setMissingReasons(toMissingReasons(readiness, error.details))
        setErrorMessage(error.message)
      } else {
        setPhase("payment_error")
        setErrorMessage(error instanceof Error ? error.message : t("unlock.paymentFailedDescription"))
      }

      logBreadcrumb("invoice_create_failed", {
        code: error instanceof ApiClientError ? error.code : "UNKNOWN",
        status: error instanceof ApiClientError ? error.status : null,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const titleForPhase =
    phase === "insufficient_block"
      ? t("unlock.insufficientBlockTitle")
      : phase === "manual_followup_hint"
        ? t("unlock.manualFollowupTitle")
        : phase === "payment_error"
          ? t("unlock.paymentFailedTitle")
          : t("unlock.purchaseTitle")

  const descriptionForPhase =
    phase === "insufficient_block"
      ? t("unlock.insufficientBlockDescription")
      : phase === "manual_followup_hint"
        ? t("unlock.manualFollowupDescription")
        : phase === "payment_error"
          ? t("unlock.paymentFailedDescription")
          : t("unlock.purchaseDescription")

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        {resolvedLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleCloseDialog}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{titleForPhase}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{descriptionForPhase}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {isCheckingReadiness ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("unlock.checkingReadiness")}
              </div>
            ) : null}

            {missingReasons.length > 0 ? (
              <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4">
                <p className="mb-2 text-sm font-medium text-foreground">{t("unlock.missingReasonsTitle")}</p>
                <div className="flex flex-wrap gap-2">
                  {missingReasons.map((reason) => (
                    <Badge key={reason} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-3 rounded-xl bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("unlock.extendedReport")}</span>
                <span className="font-semibold">$29.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">{t("unlock.total")}</span>
                <span className="text-lg font-bold text-primary">$29.00</span>
              </div>
            </div>

            {phase === "manual_followup_hint" ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{t("unlock.manualFollowupDescription")}</span>
                </p>
              </div>
            ) : null}

            <Button
              className="h-12 w-full rounded-xl"
              onClick={() => setIsMonoConfirmOpen(true)}
              disabled={isProcessing || isCheckingReadiness || !canPay}
            >
              {isProcessing ? t("unlock.redirectingToPayment") : t("unlock.completePurchase")}
            </Button>

            {phase === "payment_error" ? (
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl"
                onClick={() => void handleCreateInvoice()}
                disabled={isProcessing || isCheckingReadiness}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                {t("unlock.tryAgain")}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMonoConfirmOpen} onOpenChange={setIsMonoConfirmOpen}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{monoTitle}</DialogTitle>
            <DialogDescription>{t("unlock.purchaseDescription")}</DialogDescription>
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
              className="h-12 w-full rounded-xl"
              onClick={() => {
                setIsMonoConfirmOpen(false)
                void handleCreateInvoice()
              }}
              disabled={isProcessing || isCheckingReadiness || !canPay}
            >
              {isProcessing ? t("unlock.redirectingToPayment") : monoButtonLabel}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={() => setIsMonoConfirmOpen(false)}
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
