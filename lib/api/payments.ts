import { apiFetch } from "@/lib/api/client"
import {
  normalizeCreateMonobankInvoiceResponse,
  normalizeReportReadinessResponse,
  normalizeReportRequestResponse,
} from "@/lib/api/normalize-backend-response"
import type {
  CreateMonobankInvoiceRequest,
  CreateMonobankInvoiceResponse,
  ReportReadinessResponse,
  ReportRequestResponse,
} from "@/lib/api/types"

export async function getReportReadiness(assessmentId: string) {
  const payload = await apiFetch<unknown>(`/reports/readiness/${assessmentId}`, {
    method: "GET",
  })
  return normalizeReportReadinessResponse(payload)
}

export async function createMonobankInvoice(body: CreateMonobankInvoiceRequest) {
  const payload = await apiFetch<unknown>("/payments/monobank/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return normalizeCreateMonobankInvoiceResponse(payload)
}

export async function getReportRequest(reportRequestId: string) {
  const payload = await apiFetch<unknown>(`/reports/requests/${reportRequestId}`, {
    method: "GET",
  })
  return normalizeReportRequestResponse(payload)
}

export function storeLatestReportRequestId(reportRequestId: string | undefined) {
  if (!reportRequestId || typeof window === "undefined") return
  window.localStorage.setItem("latest_report_request_id", reportRequestId)
}

export function readLatestReportRequestId() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("latest_report_request_id")
}
