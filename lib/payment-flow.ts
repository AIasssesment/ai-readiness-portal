import {
  clearPaymentBridgeSession,
  launchPaymentGateway,
  openPaymentGatewayTab,
  resolvePaymentReturnTo,
} from "@/lib/payment-bridge"
import { startPaymentStatusWatch } from "@/lib/payment-status-watch"

type LaunchPaymentFlowOptions = {
  pageUrl: string
  reportRequestId?: string
  assessmentId?: string
  locale: string
  isLoggedIn?: boolean
  paymentWindow?: Window | null
}

export type PaymentLaunchResult =
  | { mode: "new_tab"; popupBlocked: false }
  | { mode: "same_tab"; popupBlocked: boolean }

export function preparePaymentWindow(): Window | null {
  return openPaymentGatewayTab()
}

export function beginPaymentFlow(options: LaunchPaymentFlowOptions): PaymentLaunchResult {
  clearPaymentBridgeSession()

  const returnTo = resolvePaymentReturnTo({
    assessmentId: options.assessmentId,
    isLoggedIn: options.isLoggedIn,
  })

  const mode = launchPaymentGateway(options.pageUrl, returnTo, options.paymentWindow)

  if (mode === "blocked") {
    return { mode: "same_tab", popupBlocked: true }
  }

  if (options.reportRequestId && mode === "new_tab") {
    startPaymentStatusWatch({
      reportRequestId: options.reportRequestId,
      assessmentId: options.assessmentId,
      locale: options.locale,
    })
  }

  return { mode, popupBlocked: false }
}

export function buildPaymentFailPath(
  locale: string,
  assessmentId?: string,
  isLoggedIn?: boolean,
): string {
  const returnTo = resolvePaymentReturnTo({ assessmentId, isLoggedIn })
  const params = new URLSearchParams()
  params.set("returnLocale", locale)
  params.set("returnTo", returnTo)
  if (assessmentId) {
    params.set("assessmentId", assessmentId)
  }
  return `/payment/fail?${params.toString()}`
}

export function buildPaymentSuccessPath(locale: string, assessmentId?: string): string {
  const params = new URLSearchParams()
  params.set("returnLocale", locale)
  if (assessmentId) {
    params.set("assessmentId", assessmentId)
  }
  return `/payment/success?${params.toString()}`
}
