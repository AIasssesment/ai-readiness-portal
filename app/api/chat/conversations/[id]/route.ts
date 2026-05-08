import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"
import { apiErrors } from "@/lib/http/api-errors"

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
      return apiErrors.unauthorized()
    }

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) {
      return apiErrors.notFound("Client profile not found")
    }

    if (!(await hasConversationAccess(id, clientId))) {
      return apiErrors.notFound("Conversation not found")
    }

    const body = (await request.json()) as { title?: string }
    const title = body.title?.trim()
    if (!title) {
      return apiErrors.badRequest("Title is required")
    }

    await sql`
      update conversations
      set title = ${title.slice(0, 120)}, updated_at = now()
      where id = ${id}
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("update conversation api error", error)
    return apiErrors.internal("Failed to update conversation")
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
      return apiErrors.unauthorized()
    }

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) {
      return apiErrors.notFound("Client profile not found")
    }

    if (!(await hasConversationAccess(id, clientId))) {
      return apiErrors.notFound("Conversation not found")
    }

    await sql`
      delete from conversations
      where id = ${id}
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("delete conversation api error", error)
    return apiErrors.internal("Failed to delete conversation")
  }
}
