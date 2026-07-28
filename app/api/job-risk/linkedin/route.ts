import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"
import { backendErrorResponse } from "@/lib/api/backend-route"
import { resolveClientIdForUser } from "@/lib/api/resolve-client"
import { getSessionUser } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await resolveClientIdForUser(user.id)
    if (!clientId) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const body = (await request.json().catch(() => null)) as { linkedin?: unknown } | null
    const linkedin = typeof body?.linkedin === "string" ? body.linkedin : ""

    const payload = await backendFetch<unknown>(
      `/clients/${clientId}/company-enrichment/linkedin`,
      {
        method: "POST",
        clientId,
        body: JSON.stringify({ linkedin }),
      },
    )
    return NextResponse.json(payload)
  } catch (error) {
    return backendErrorResponse(error, "Failed to save LinkedIn URL")
  }
}
