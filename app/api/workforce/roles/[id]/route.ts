import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"
import { backendErrorResponse } from "@/lib/api/backend-route"
import { resolveClientIdForUser } from "@/lib/api/resolve-client"
import { getSessionUser } from "@/lib/auth/session"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await resolveClientIdForUser(user.id)
    if (!clientId) return NextResponse.json({ error: "Client profile not found" }, { status: 404 })

    const payload = await backendFetch<{ ok: true }>(
      `/clients/${clientId}/workforce/roles/${id}`,
      { method: "DELETE", clientId },
    )
    return NextResponse.json(payload)
  } catch (error) {
    return backendErrorResponse(error, "Failed to delete workforce role")
  }
}
