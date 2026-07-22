import type {
  CreateMonobankInvoiceResponse,
  ReportReadinessResponse,
  ReportRequestResponse,
} from "@/lib/api/types"

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null
  return value as Record<string, unknown>
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string") return value
  }
  return undefined
}

function readBoolean(record: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "boolean") return value
  }
  return undefined
}

function readStringArray(record: Record<string, unknown>, ...keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = record[key]
    if (!Array.isArray(value)) continue
    const strings = value.filter((item): item is string => typeof item === "string")
    if (strings.length > 0) return strings
  }
  return undefined
}

export function normalizeCreateMonobankInvoiceResponse(payload: unknown): CreateMonobankInvoiceResponse {
  const record = asRecord(payload)
  if (!record) {
    throw new Error("Invalid Monobank invoice response")
  }

  const paymentId = readString(record, "paymentId", "payment_id") ?? ""
  const invoiceId = readString(record, "invoiceId", "invoice_id") ?? ""
  const pageUrl = readString(record, "pageUrl", "page_url") ?? ""
  const status = readString(record, "status") ?? ""
  const reportRequestId = readString(record, "reportRequestId", "report_request_id")

  return { paymentId, invoiceId, pageUrl, status, reportRequestId }
}

export function normalizeReportReadinessResponse(payload: unknown): ReportReadinessResponse {
  const record = asRecord(payload)
  if (!record) {
    throw new Error("Invalid report readiness response")
  }

  const reportDataReady =
    readBoolean(record, "reportDataReady", "report_data_ready") ?? false
  const missingReasons = readStringArray(record, "missingReasons", "missing_reasons")

  const scoringRaw = asRecord(record.scoring)
  const scoring = scoringRaw
    ? {
        internalScore: Number(scoringRaw.internalScore ?? scoringRaw.internal_score ?? 0),
        externalScore: Number(scoringRaw.externalScore ?? scoringRaw.external_score ?? 0),
        externalConfidence: Number(
          scoringRaw.externalConfidence ?? scoringRaw.external_confidence ?? 0,
        ),
        fpiScore: Number(scoringRaw.fpiScore ?? scoringRaw.fpi_score ?? 0),
        signals:
          (asRecord(scoringRaw.signals) as Record<string, number> | null) ??
          ({} as Record<string, number>),
        signalCount: Number(scoringRaw.signalCount ?? scoringRaw.signal_count ?? 0),
      }
    : undefined

  return {
    reportDataReady,
    missingReasons,
    scoring,
  }
}

export function normalizeReportRequestResponse(payload: unknown): ReportRequestResponse {
  const record = asRecord(payload)
  if (!record) {
    throw new Error("Invalid report request response")
  }

  const id = readString(record, "id") ?? ""
  const status = (readString(record, "status") ?? "pending_payment") as ReportRequestResponse["status"]

  return {
    id,
    status,
    clientId: readString(record, "clientId", "client_id"),
    assessmentId:
      readString(record, "assessmentId", "assessment_id") ??
      (record.assessment_id === null ? null : undefined),
    paymentId: readString(record, "paymentId", "payment_id") ?? null,
    mode: readString(record, "mode") as ReportRequestResponse["mode"] | undefined,
    reportDataReady: readBoolean(record, "reportDataReady", "report_data_ready"),
    missingReasons: readStringArray(record, "missingReasons", "missing_reasons"),
    manualDueAt: readString(record, "manualDueAt", "manual_due_at") ?? null,
    completedAt: readString(record, "completedAt", "completed_at") ?? null,
  }
}
