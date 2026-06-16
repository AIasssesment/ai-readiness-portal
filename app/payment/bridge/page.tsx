"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getBridgeStorageKey } from "@/lib/payment-bridge"

function PaymentBridgeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const pageUrl = searchParams.get("to")
    const returnTo = searchParams.get("returnTo") || "/portal"
    const bridgeId = searchParams.get("bid")
    const storageKey = getBridgeStorageKey(bridgeId)

    const redirectBack = () => {
      sessionStorage.removeItem(storageKey)
      router.replace(returnTo)
    }

    const goToGateway = () => {
      if (!pageUrl) {
        redirectBack()
        return
      }

      sessionStorage.setItem(storageKey, "1")
      window.location.href = pageUrl
    }

    const wasActive = sessionStorage.getItem(storageKey) === "1"
    if (wasActive) {
      redirectBack()
      return
    }

    goToGateway()

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      if (sessionStorage.getItem(storageKey) === "1") {
        redirectBack()
      }
    }

    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [router, searchParams])

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
    </main>
  )
}

export default function PaymentBridgePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        </main>
      }
    >
      <PaymentBridgeContent />
    </Suspense>
  )
}
