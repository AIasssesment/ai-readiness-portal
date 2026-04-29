import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"

type Body = {
  table: "clients"
  filters?: Array<{ column: string; value: unknown }>
  update?: Record<string, unknown> | null
  single?: boolean
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Body
    if (body.table !== "clients") {
      return NextResponse.json({ error: "Unsupported table" }, { status: 400 })
    }

    if (body.update) {
      const updated = await sql`
        update clients
        set ${sql(body.update)}, updated_at = now()
        where user_id = ${user.id}
        returning *
      `
      return NextResponse.json({ data: body.single ? (updated[0] ?? null) : updated })
    }

    const rows = await sql`
      select *
      from clients
      where user_id = ${user.id}
      limit 1
    `
    return NextResponse.json({ data: body.single ? (rows[0] ?? null) : rows })
  } catch (error) {
    console.error("db query error", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }
}
