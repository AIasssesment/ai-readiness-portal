import { NextResponse } from "next/server"
import { ApiClientError } from "@/lib/api/client"
import { backendFetch } from "@/lib/api/backend"
import { backendErrorResponse } from "@/lib/api/backend-route"
import { resolveClientIdForUser } from "@/lib/api/resolve-client"
import { getSessionUser } from "@/lib/auth/session"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await resolveClientIdForUser(user.id)
    if (!clientId) return NextResponse.json({ error: "Client profile not found" }, { status: 404 })

    const payload = await backendFetch<{ roles: unknown[] }>(
      `/clients/${clientId}/workforce/roles`,
      { method: "GET", clientId },
    )
    return NextResponse.json(payload)
  } catch (error) {
    return backendErrorResponse(error, "Failed to load workforce roles")
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await resolveClientIdForUser(user.id)
    if (!clientId) return NextResponse.json({ error: "Client profile not found" }, { status: 404 })

    const body = (await request.json()) as {
      role_title?: string
      roleTitle?: string
      department?: string | null
      employee_count?: number
      employeeCount?: number
    }

    const roleTitle = (body.role_title ?? body.roleTitle)?.trim()
    const employeeCount = Number(body.employee_count ?? body.employeeCount ?? NaN)
    if (!roleTitle || Number.isNaN(employeeCount) || employeeCount < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const payload = await backendFetch<{ id: string; ok: true }>(
      `/clients/${clientId}/workforce/roles`,
      {
        method: "POST",
        clientId,
        body: JSON.stringify({
          roleTitle,
          department: body.department?.trim() || null,
          employeeCount,
        }),
      },
    )
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 400) {
      return backendErrorResponse(error, "Invalid payload")
    }
    return backendErrorResponse(error, "Failed to save workforce role")
  }
}
