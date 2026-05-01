"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { DefaultChatTransport } from "ai"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversationId")
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const { locale, t } = useLanguage()

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
        <p className="text-sm text-muted-foreground">{t("chat.loading")}</p>
      </div>
    )
  }

  return (
    <ChatSession
      key={`${conversationId ?? "new"}-${historyKey}`}
      conversationId={conversationId}
      initialMessages={initialMessages}
      locale={locale}
      t={t}
    />
  )
}

function ChatSession({
  conversationId,
  initialMessages,
  locale,
  t,
}: {
  conversationId: string | null
  initialMessages: UIMessage[]
  locale: "en" | "uk"
  t: (key: import("@/lib/i18n").TranslationKey) => string
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
    <div className="-mb-8 flex h-[calc(100dvh-6rem)] min-h-[84vh] flex-col md:h-[calc(100dvh-5rem)]">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/60 bg-card/80">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-xl">{t("chat.title")}</CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              {t("chat.emptyHint")}
            </p>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? "ml-auto max-w-[82%]" : "max-w-[82%]"}
            >
              <div
                className={
                  message.role === "user"
                    ? "rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground shadow-sm"
                    : "rounded-2xl rounded-bl-md border border-border/60 bg-muted/45 px-4 py-3"
                }
              >
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

        <div className="sticky bottom-0 border-t border-border/60 bg-card/95 px-4 pb-4 pt-3 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.inputPlaceholder")}
              rows={2}
              className="resize-none rounded-2xl border-border/70 bg-background/70"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={status === "streaming" || !input.trim()}>
                {status === "streaming" ? t("chat.thinking") : t("chat.send")}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
