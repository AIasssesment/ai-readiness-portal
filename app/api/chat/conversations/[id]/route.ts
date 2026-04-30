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

async function hasConversationAccess(conversationId: string, clientId: string) {
  const rows = await sql<Array<{ id: string }>>`
    select id
    from conversations
    where id = ${conversationId}
      and client_id = ${clientId}
    limit 1
  `
  return Boolean(rows[0])
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    if (!(await hasConversationAccess(id, clientId))) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const body = (await request.json()) as { title?: string }
    const title = body.title?.trim()
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    await sql`
      update conversations
      set title = ${title.slice(0, 120)}, updated_at = now()
      where id = ${id}
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("update conversation api error", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    if (!(await hasConversationAccess(id, clientId))) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    await sql`
      delete from conversations
      where id = ${id}
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("delete conversation api error", error)
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
  }
}
