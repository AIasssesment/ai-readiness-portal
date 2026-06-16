import { getReportRequest } from "@/lib/api/payments"
import { PAYMENT_WATCH_REQUEST_KEY } from "@/lib/payment-bridge"

const PAID_STATUSES = new Set(["paid", "pending_manual", "ready"])

type PaymentWatchOptions = {
  reportRequestId: string
  assessmentId?: string
  locale: string
  onPaid?: () => void
  onFailed?: () => void
}

export function startPaymentStatusWatch(options: PaymentWatchOptions): () => void {
  if (typeof window === "undefined") return () => undefined

  sessionStorage.setItem(PAYMENT_WATCH_REQUEST_KEY, options.reportRequestId)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let stopped = false

  const stop = () => {
    if (stopped) return
    stopped = true
    if (intervalId) clearInterval(intervalId)
    document.removeEventListener("visibilitychange", onVisible)
    window.removeEventListener("focus", onVisible)
  }

  const check = async () => {
    const activeId = sessionStorage.getItem(PAYMENT_WATCH_REQUEST_KEY)
    if (!activeId || activeId !== options.reportRequestId) {
      stop()
      return
    }

    try {
      const request = await getReportRequest(activeId)

      if (PAID_STATUSES.has(request.status)) {
        sessionStorage.removeItem(PAYMENT_WATCH_REQUEST_KEY)
        stop()
        options.onPaid?.()

        const params = new URLSearchParams()
        params.set("returnLocale", options.locale)
        params.set("reportRequestId", activeId)
        if (options.assessmentId) {
          params.set("assessmentId", options.assessmentId)
        }

        window.location.assign(`/payment/success?${params.toString()}`)
        return
      }

      if (request.status === "failed") {
        sessionStorage.removeItem(PAYMENT_WATCH_REQUEST_KEY)
        stop()
        options.onFailed?.()
      }
    } catch {
      // Ignore transient poll errors
    }
  }

  const onVisible = () => {
    if (document.visibilityState === "visible") {
      void check()
    }
  }

  document.addEventListener("visibilitychange", onVisible)
  window.addEventListener("focus", onVisible)
  intervalId = setInterval(() => void check(), 4000)
  void check()

  return stop
}
