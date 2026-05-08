import { apiFetch } from "@/lib/api/client"
import type {
  CreateMonobankInvoiceRequest,
  CreateMonobankInvoiceResponse,
  ReportReadinessResponse,
  ReportRequestResponse,
} from "@/lib/api/types"

export async function getReportReadiness(assessmentId: string) {
  return apiFetch<ReportReadinessResponse>(`/reports/readiness/${assessmentId}`, {
    method: "GET",
  })
}

export async function createMonobankInvoice(body: CreateMonobankInvoiceRequest) {
  return apiFetch<CreateMonobankInvoiceResponse>("/payments/monobank/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function getReportRequest(reportRequestId: string) {
  return apiFetch<ReportRequestResponse>(`/reports/requests/${reportRequestId}`, {
    method: "GET",
  })
}

export function storeLatestReportRequestId(reportRequestId: string | undefined) {
  if (!reportRequestId || typeof window === "undefined") return
  window.localStorage.setItem("latest_report_request_id", reportRequestId)
}

export function readLatestReportRequestId() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("latest_report_request_id")
}
