import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"

function normalizeRole(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function getClientIdByUser(userId: string) {
  const rows = await sql<Array<{ id: string }>>`
    select id
    from clients
    where user_id = ${userId}
    limit 1
  `
  return rows[0]?.id ?? null
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) return NextResponse.json({ error: "Client profile not found" }, { status: 404 })

    const roles = await sql<Array<{
      id: string
      role_title: string
      department: string | null
      employee_count: number
      normalized_role: string
    }>>`
      select id, role_title, department, employee_count, normalized_role
      from workforce_roles
      where client_id = ${clientId}
      order by employee_count desc, role_title asc
    `

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("workforce roles GET error", error)
    return NextResponse.json({ error: "Failed to load workforce roles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) return NextResponse.json({ error: "Client profile not found" }, { status: 404 })

    const body = (await request.json()) as {
      role_title?: string
      department?: string | null
      employee_count?: number
    }

    const roleTitle = body.role_title?.trim()
    const employeeCount = Number(body.employee_count ?? 0)
    if (!roleTitle || Number.isNaN(employeeCount) || employeeCount < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const normalized = normalizeRole(roleTitle)
    const rows = await sql<Array<{ id: string }>>`
      insert into workforce_roles (client_id, role_title, normalized_role, department, employee_count)
      values (${clientId}, ${roleTitle}, ${normalized}, ${body.department?.trim() || null}, ${employeeCount})
      on conflict (client_id, normalized_role)
      do update set
        role_title = excluded.role_title,
        department = excluded.department,
        employee_count = excluded.employee_count,
        updated_at = now()
      returning id
    `

    return NextResponse.json({ id: rows[0]?.id, ok: true })
  } catch (error) {
    console.error("workforce roles POST error", error)
    return NextResponse.json({ error: "Failed to save workforce role" }, { status: 500 })
  }
}
