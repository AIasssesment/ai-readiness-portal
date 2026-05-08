export type PaymentMode = "charge_and_manual" | "block"

export type ApiErrorResponse = {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type CreateMonobankInvoiceRequest = {
  clientId: string
  assessmentId?: string
  amount: number
  currency: string
  mode: PaymentMode
  returnUrlSuccess?: string
  returnUrlFail?: string
}

export type CreateMonobankInvoiceResponse = {
  paymentId: string
  invoiceId: string
  pageUrl: string
  status: string
  reportRequestId?: string
}

export type ReportReadinessResponse = {
  reportDataReady: boolean
  missingReasons?: string[]
  scoring?: {
    internalScore: number
    externalScore: number
    externalConfidence: number
    fpiScore: number
    signals: Record<string, number>
    signalCount: number
  }
}

export type ReportRequestResponse = {
  id: string
  clientId?: string
  assessmentId?: string | null
  paymentId?: string | null
  mode?: PaymentMode | "auto"
  status: "pending_payment" | "paid" | "pending_manual" | "ready" | "failed"
  reportDataReady?: boolean
  missingReasons?: string[]
  manualDueAt?: string | null
  completedAt?: string | null
}
