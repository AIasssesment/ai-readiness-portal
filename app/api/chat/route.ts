import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"
import { buildChatContext, getChatContext } from "@/lib/chat-context"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientId = await getClientIdByUser(user.id)
    if (!clientId) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const url = new URL(request.url)
    const conversationId = url.searchParams.get("conversationId")
    if (!conversationId) {
      return NextResponse.json({ messages: [] })
    }

    const allowed = await hasConversationAccess(conversationId, clientId)
    if (!allowed) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const rows = await sql<Array<{ id: string; role: "user" | "assistant" | "system"; content: string }>>`
      select id, role, content
      from messages
      where conversation_id = ${conversationId}
      order by created_at asc
    `

    const messages = rows.map((row) => ({
      id: row.id,
      role: row.role,
      parts: [{ type: "text", text: row.content }],
    })) as UIMessage[]

    return NextResponse.json({ messages, conversationId })
  } catch (error) {
    console.error("chat history api error", error)
    return NextResponse.json({ error: "Failed to load chat history" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as { messages?: UIMessage[]; conversationId?: string }
    const messages = body.messages || []
    const clientId = await getClientIdByUser(user.id)
    if (!clientId) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const context = await getChatContext(clientId)
    const system = buildChatContext(context)

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")
    const latestUserText = latestUserMessage?.parts
      ?.filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("\n")
      .trim()

    const url = new URL(request.url)
    let conversationId = body.conversationId ?? url.searchParams.get("conversationId") ?? undefined

    if (conversationId) {
      const allowed = await hasConversationAccess(conversationId, clientId)
      if (!allowed) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
      }
    }

    if (!conversationId) {
      const titleBase = latestUserText || "New Chat"
      const createdConversations = await sql<Array<{ id: string }>>`
        insert into conversations (client_id, title)
        values (${clientId}, ${titleBase.slice(0, 80)})
        returning id
      `
      conversationId = createdConversations[0]?.id
    }

    if (conversationId && latestUserText) {
      await sql`
        insert into messages (conversation_id, role, content)
        values (${conversationId}, 'user', ${latestUserText})
      `
      await sql`
        update conversations
        set updated_at = now()
        where id = ${conversationId}
      `
    }

    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model: openai("gpt-4o"),
      system,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        if (!conversationId || !text?.trim()) return
        await sql`
          insert into messages (conversation_id, role, content)
          values (${conversationId}, 'assistant', ${text})
        `
        await sql`
          update conversations
          set updated_at = now()
          where id = ${conversationId}
        `
      },
    })

    return result.toUIMessageStreamResponse({
      headers: conversationId ? { "x-conversation-id": conversationId } : undefined,
    })
  } catch (error) {
    console.error("chat api error", error)
    return NextResponse.json({ error: "Failed to generate chat response" }, { status: 500 })
  }
}
