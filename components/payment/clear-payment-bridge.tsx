"use client"

import { useEffect } from "react"
import { clearPaymentBridgeSession } from "@/lib/payment-bridge"

export function ClearPaymentBridge() {
  useEffect(() => {
    clearPaymentBridgeSession()
  }, [])

  return null
}
