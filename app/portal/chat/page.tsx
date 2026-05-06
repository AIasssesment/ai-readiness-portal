"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { DefaultChatTransport } from "ai"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, MessagesSquare, Pencil, Search, Trash2, X } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversationId")
  const showMobileSearch = searchParams.get("openSearch") === "1"
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const { t } = useLanguage()

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
    <>
      {showMobileSearch ? <MobileChatSearchOverlay t={t} /> : null}
      <ChatSession
        key={`${conversationId ?? "new"}-${historyKey}`}
        conversationId={conversationId}
        initialMessages={initialMessages}
        t={t}
      />
    </>
  )
}

function MobileChatSearchOverlay({
  t,
}: {
  t: (key: import("@/lib/i18n").TranslationKey) => string
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [conversations, setConversations] = useState<
    Array<{ id: string; title: string; isStarred: boolean; href: string }>
  >([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const response = await fetch("/api/chat/conversations")
      if (!response.ok) return
      const payload = (await response.json()) as {
        conversations?: Array<{ id: string; title: string; isStarred: boolean; href: string }>
      }
      if (!cancelled) {
        setConversations(payload.conversations ?? [])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = conversations.filter((chat) =>
    chat.title.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <div className="fixed inset-0 z-50 bg-background md:hidden">
      <div className="border-b p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              placeholder={t("portal.chat.searchPlaceholder")}
              className="h-10 pl-9"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/portal/chat")}
            aria-label={t("common.cancel")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="h-[calc(100dvh-4.5rem)] overflow-y-auto p-3">
        <Link
          href="/portal/chat"
          className="mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
          {t("portal.createChat")}
        </Link>

        {filtered.length > 0 ? (
          <div className="space-y-1">
            {filtered.map((chat) => (
              <Link
                key={chat.id}
                href={chat.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{chat.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            {query.trim() ? t("portal.chat.noSearchResults") : t("portal.chat.noRecent")}
          </p>
        )}
      </div>
    </div>
  )
}

function ChatSession({
  conversationId,
  initialMessages,
  t,
}: {
  conversationId: string | null
  initialMessages: UIMessage[]
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

  const handleRenameChat = async () => {
    if (!conversationId) return

    const nextTitle = window.prompt(t("portal.chat.renamePlaceholder"), "")
    const sanitized = nextTitle?.trim()
    if (!sanitized) return

    const response = await fetch(`/api/chat/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: sanitized }),
    })
    if (!response.ok) return
    router.refresh()
  }

  const handleDeleteChat = async () => {
    if (!conversationId) return
    const shouldDelete = window.confirm(t("portal.chat.deleteConfirm"))
    if (!shouldDelete) return

    const response = await fetch(`/api/chat/conversations/${conversationId}`, {
      method: "DELETE",
    })
    if (!response.ok) return
    router.push("/portal/chat")
    router.refresh()
  }

  return (
    <div className="-mb-8 flex h-[calc(100dvh-6rem)] min-h-[84vh] flex-col md:h-[calc(100dvh-5rem)]">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/60 bg-card/80">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">{t("chat.title")}</CardTitle>
            {conversationId ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label={t("portal.menu")}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={handleRenameChat}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("portal.chat.rename")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteChat}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("portal.chat.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
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
