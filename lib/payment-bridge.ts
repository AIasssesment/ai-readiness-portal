export const PAYMENT_BRIDGE_SESSION_KEY = "payment_bridge_active"
export const PAYMENT_WATCH_REQUEST_KEY = "payment_watch_request_id"

function bridgeStorageKey(bridgeId: string) {
  return `payment_bridge_${bridgeId}`
}

export function buildPaymentBridgeUrl(pageUrl: string, returnTo: string) {
  const bridgeId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const params = new URLSearchParams({
    to: pageUrl,
    returnTo,
    bid: bridgeId,
  })
  return `/payment/bridge?${params.toString()}`
}

export function getBridgeStorageKey(bridgeId: string | null): string {
  return bridgeId ? bridgeStorageKey(bridgeId) : PAYMENT_BRIDGE_SESSION_KEY
}

export function resolvePaymentReturnTo(options: {
  assessmentId?: string
  isLoggedIn?: boolean
  fallbackPath?: string
}): string {
  if (options.assessmentId) {
    return `/portal/assessments/${options.assessmentId}`
  }
  if (options.isLoggedIn) {
    return "/portal/assessments"
  }
  if (options.fallbackPath) {
    return options.fallbackPath
  }
  if (typeof window !== "undefined") {
    const current = `${window.location.pathname}${window.location.search}`
    return current || "/portal"
  }
  return "/portal"
}

/** Open a blank tab synchronously (must run inside a user click handler). */
export function openPaymentGatewayTab(): Window | null {
  if (typeof window === "undefined") return null

  const win = window.open("about:blank", "_blank")
  if (!win) return null

  try {
    win.opener = null
  } catch {
    // noop
  }

  return win
}

export function launchPaymentGateway(
  pageUrl: string,
  returnTo: string,
  paymentWindow?: Window | null,
): "new_tab" | "same_tab" | "blocked" {
  if (typeof window === "undefined") return "same_tab"

  if (paymentWindow && !paymentWindow.closed) {
    // New tab: go straight to Monobank (bridge sessionStorage breaks across tabs).
    paymentWindow.location.href = pageUrl
    return "new_tab"
  }

  if (paymentWindow === null) {
    return "blocked"
  }

  const bridgeUrl = buildPaymentBridgeUrl(pageUrl, returnTo)
  window.location.href = bridgeUrl
  return "same_tab"
}

/** @deprecated Prefer launchPaymentGateway with openPaymentGatewayTab */
export function redirectToPaymentGateway(pageUrl: string, returnTo?: string) {
  const returnPath = returnTo ?? resolvePaymentReturnTo({})
  launchPaymentGateway(pageUrl, returnPath)
}

export function clearPaymentBridgeSession() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(PAYMENT_BRIDGE_SESSION_KEY)
}
