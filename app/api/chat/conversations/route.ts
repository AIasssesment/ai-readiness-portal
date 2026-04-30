import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"

async function getClientIdByUser(userId: string) {
  const clients = await sql<Array<{ id: string }>>`
    select id
    from clients
    where user_id = ${userId}
    limit 1
  `
  return clients[0]?.id ?? null
}

export async function POST() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const rows = await sql<Array<{ id: string }>>`
      insert into conversations (client_id, title)
      values (${clientId}, 'New Chat')
      returning id
    `

    return NextResponse.json({ id: rows[0]?.id })
  } catch (error) {
    console.error("create conversation api error", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
