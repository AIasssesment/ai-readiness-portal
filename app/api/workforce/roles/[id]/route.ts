import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"

async function getClientIdByUser(userId: string) {
  const rows = await sql<Array<{ id: string }>>`
    select id
    from clients
    where user_id = ${userId}
    limit 1
  `
  return rows[0]?.id ?? null
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) return NextResponse.json({ error: "Client profile not found" }, { status: 404 })

    await sql`
      delete from workforce_roles
      where id = ${id}
        and client_id = ${clientId}
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("workforce role DELETE error", error)
    return NextResponse.json({ error: "Failed to delete workforce role" }, { status: 500 })
  }
}
