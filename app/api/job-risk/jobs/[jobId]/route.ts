import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"
import { backendErrorResponse } from "@/lib/api/backend-route"
import { resolveClientIdForUser } from "@/lib/api/resolve-client"
import { getSessionUser } from "@/lib/auth/session"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await resolveClientIdForUser(user.id)
    if (!clientId) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const payload = await backendFetch<unknown>(`/clients/${clientId}/job-risk/jobs/${jobId}`, {
      method: "GET",
      clientId,
    })

    if (!payload) {
      return NextResponse.json(
        { error: { code: "JOB_NOT_FOUND", message: "Job not found" } },
        { status: 404 },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    return backendErrorResponse(error, "Failed to load job status")
  }
}
