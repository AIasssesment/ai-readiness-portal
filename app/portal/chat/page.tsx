"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { DefaultChatTransport } from "ai"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversationId")
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadHistory = async () => {
      if (!conversationId) {
        setInitialMessages([])
        setHistoryKey((value) => value + 1)
        return
      }

      setIsLoadingHistory(true)
      try {
        const response = await fetch(`/api/chat?conversationId=${encodeURIComponent(conversationId)}`)
        const payload = (await response.json()) as { messages?: UIMessage[] }
        if (!cancelled) {
          setInitialMessages(payload.messages ?? [])
          setHistoryKey((value) => value + 1)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false)
        }
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [conversationId])

  if (isLoadingHistory) {
    return (
      <div className="grid h-full min-h-[70vh] place-items-center">
        <p className="text-sm text-muted-foreground">Loading chat...</p>
      </div>
    )
  }

  return (
    <ChatSession
      key={`${conversationId ?? "new"}-${historyKey}`}
      conversationId={conversationId}
      initialMessages={initialMessages}
    />
  )
}

function ChatSession({
  conversationId,
  initialMessages,
}: {
  conversationId: string | null
  initialMessages: UIMessage[]
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const refreshedForMessageCount = useRef(0)
  const [input, setInput] = useState("")
  const router = useRouter()
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: conversationId ? `/api/chat?conversationId=${encodeURIComponent(conversationId)}` : "/api/chat",
    }),
    messages: initialMessages,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (status !== "ready") return
    if (messages.length === 0) return
    if (refreshedForMessageCount.current === messages.length) return

    refreshedForMessageCount.current = messages.length
    router.refresh()
  }, [messages.length, router, status])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || status === "streaming") return
    sendMessage({ text })
    setInput("")
  }

  return (
    <div className="grid h-full min-h-[70vh] grid-rows-[1fr_auto] gap-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>AI Advisor</CardTitle>
        </CardHeader>
        <CardContent className="h-[60vh] overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask about your score, opportunities, or job-risk report.
            </p>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? "ml-auto max-w-[80%]" : "max-w-[80%]"}
            >
              <div className={message.role === "user" ? "rounded-lg bg-primary p-3 text-primary-foreground" : "rounded-lg bg-muted p-3"}>
                {message.parts
                  .filter((p) => p.type === "text")
                  .map((p, index) => (
                    <p key={index} className="whitespace-pre-wrap text-sm">
                      {"text" in p ? p.text : ""}
                    </p>
                  ))}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Advisor..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={status === "streaming" || !input.trim()}>
            {status === "streaming" ? "Thinking..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  )
}
