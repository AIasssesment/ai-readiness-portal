"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"
import { getReportRequest, readLatestReportRequestId } from "@/lib/api/payments"
import type { ReportRequestResponse } from "@/lib/api/types"
import { t, type Locale, isLocale } from "@/lib/i18n"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [reportRequest, setReportRequest] = useState<ReportRequestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reportRequestId = useMemo(() => {
    const fromQuery = searchParams.get("reportRequestId")
    return fromQuery || readLatestReportRequestId()
  }, [searchParams])

  const assessmentIdFromQuery = useMemo(() => searchParams.get("assessmentId"), [searchParams])
  const testPaid = useMemo(() => searchParams.get("testPaid") === "1", [searchParams])

  const returnLocaleParam = searchParams.get("returnLocale")
  const locale = useMemo((): Locale => {
    if (isLocale(returnLocaleParam)) return returnLocaleParam
    return "en"
  }, [returnLocaleParam])

  useEffect(() => {
    let cancelled = false

    if (!reportRequestId) {
      setLoading(false)
      return
    }

    void getReportRequest(reportRequestId)
      .then((response) => {
        if (cancelled) return
        setReportRequest(response)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : t(locale, "payment.success.errorLoad"))
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reportRequestId, locale])

  const effectiveStatus = testPaid ? "ready" : reportRequest?.status

  const headline = useMemo(() => {
    if (effectiveStatus === "ready") return t(locale, "payment.success.headline.ready")
    if (effectiveStatus === "pending_manual") return t(locale, "payment.success.headline.pendingManual")
    return t(locale, "payment.success.headline.default")
  }, [effectiveStatus, locale])

  const subtitle = useMemo(() => {
    if (effectiveStatus === "ready") return t(locale, "payment.success.subtitle.ready")
    if (effectiveStatus === "pending_manual") return t(locale, "payment.success.subtitle.pendingManual")
    return t(locale, "payment.success.subtitle.default")
  }, [effectiveStatus, locale])

  const assessmentIdFromRequest =
    (reportRequest as unknown as { assessmentId?: string; assessment_id?: string } | null)?.assessmentId ??
    (reportRequest as unknown as { assessmentId?: string; assessment_id?: string } | null)?.assessment_id ??
    null
  const targetAssessmentId = assessmentIdFromRequest || assessmentIdFromQuery

  const openReportHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set("openResults", "1")
    if (targetAssessmentId) params.set("assessmentId", targetAssessmentId)
    if (testPaid) params.set("testPaid", "1")
    return `/${locale}?${params.toString()}`
  }, [locale, targetAssessmentId, testPaid])

  const openPaidReport = () => {
    if (testPaid && targetAssessmentId && typeof document !== "undefined") {
      const key = "test_paid_assessment_ids"
      const current = document.cookie
        .split("; ")
        .find((part) => part.startsWith(`${key}=`))
        ?.split("=")[1]

      const decoded = current ? decodeURIComponent(current) : ""
      const ids = new Set(
        decoded
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      )
      ids.add(targetAssessmentId)

      document.cookie = `${key}=${encodeURIComponent(Array.from(ids).join(","))}; path=/; max-age=2592000; samesite=lax`
    }

    window.location.assign(openReportHref)
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <CheckCircle2 className="h-7 w-7" />}
          </div>
          <CardTitle>{headline}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground">
              {t(locale, "payment.success.loadingStatus")}
            </div>
          ) : null}

          {effectiveStatus === "pending_manual" ? (
            <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-foreground">
              <p className="flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 text-amber-600" />
                <span>{t(locale, "payment.success.manualNotice")}</span>
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="flex-1" onClick={openPaidReport}>
              {t(locale, "payment.success.openReport")}
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/portal/assessments">{t(locale, "payment.success.assessments")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
