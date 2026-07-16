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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowUp, MoreHorizontal, MessagesSquare, Pencil, Search, Sparkles, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversationId")
  const showMobileSearch = searchParams.get("openSearch") === "1"
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
    <>
      {showMobileSearch ? <MobileChatSearchOverlay t={t} /> : null}
      <ChatSession
        key={`${conversationId ?? "new"}-${historyKey}`}
        conversationId={conversationId}
        initialMessages={initialMessages}
        locale={locale}
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
  locale,
  t,
}: {
  conversationId: string | null
  initialMessages: UIMessage[]
  locale: "en" | "uk"
  t: (key: import("@/lib/i18n").TranslationKey) => string
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomRef = useRef(true)
  const refreshedForMessageCount = useRef(0)
  const [input, setInput] = useState("")
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameTitle, setRenameTitle] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: conversationId ? `/api/chat?conversationId=${encodeURIComponent(conversationId)}` : "/api/chat",
    }),
    messages: initialMessages,
  })

  // Track whether the user is near the bottom; only auto-scroll while they are.
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < 120
  }

  useEffect(() => {
    if (!stickToBottomRef.current) return
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (status !== "ready") return
    if (messages.length === 0) return
    if (refreshedForMessageCount.current === messages.length) return

    refreshedForMessageCount.current = messages.length
    router.refresh()
  }, [messages.length, router, status])

  const submit = () => {
    const text = input.trim()
    if (!text || status === "streaming") return
    sendMessage({ text })
    setInput("")
  }

  const openRenameDialog = () => {
    if (!conversationId) return
    setRenameTitle("")
    setRenameDialogOpen(true)
  }

  const handleRenameChat = async () => {
    if (!conversationId) return
    const nextTitle = renameTitle.trim()
    if (!nextTitle) return

    setIsRenaming(true)
    const response = await fetch(`/api/chat/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    })
    setIsRenaming(false)
    if (!response.ok) return

    setRenameDialogOpen(false)
    setRenameTitle("")
    router.refresh()
  }

  const openDeleteDialog = () => {
    if (!conversationId) return
    setDeleteDialogOpen(true)
  }

  const handleDeleteChat = async () => {
    if (!conversationId) return

    setIsDeleting(true)
    const response = await fetch(`/api/chat/conversations/${conversationId}`, {
      method: "DELETE",
    })
    setIsDeleting(false)
    if (!response.ok) return

    setDeleteDialogOpen(false)
    router.push("/portal/chat")
    router.refresh()
  }

  const isEmpty = messages.length === 0

  return (
    <>
    <div className="-mx-4 -my-8 flex h-[calc(100dvh-3.75rem)] flex-col bg-background md:-m-8 md:h-screen">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{t("chat.title")}</span>
        </div>
        {conversationId ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("portal.menu")}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={openRenameDialog}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("portal.chat.rename")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={openDeleteDialog}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("portal.chat.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-3xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("chat.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("chat.emptyHint")}</p>
            <div className="mt-6">
              <Composer
                input={input}
                setInput={setInput}
                onSubmit={submit}
                status={status}
                t={t}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pt-6 pb-40">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "text-[15px] leading-7 md:text-base",
                      message.role === "user"
                        ? "max-w-[85%] rounded-3xl bg-muted px-4 py-2.5"
                        : "w-full",
                    )}
                  >
                    {message.parts
                      .filter((p) => p.type === "text")
                      .map((p, index) => (
                        <p key={index} className="whitespace-pre-wrap">
                          {"text" in p ? p.text : ""}
                        </p>
                      ))}
                  </div>
                </div>
              ))}
              {status === "streaming" ? (
                <div className="flex justify-start">
                  <p className="text-sm text-muted-foreground">{t("chat.thinking")}</p>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-10">
            <div className="pointer-events-auto mx-auto w-full max-w-3xl px-4 pb-4">
              <Composer
                input={input}
                setInput={setInput}
                onSubmit={submit}
                status={status}
                t={t}
              />
            </div>
          </div>
        </div>
      )}
    </div>

    <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("portal.chat.renameTitle")}</DialogTitle>
          <DialogDescription>
            {t("portal.chat.renameDescription")}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={renameTitle}
          onChange={(event) => setRenameTitle(event.target.value)}
          placeholder={t("portal.chat.renamePlaceholder")}
          maxLength={120}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              void handleRenameChat()
            }
          }}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setRenameDialogOpen(false)
              setRenameTitle("")
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void handleRenameChat()} disabled={isRenaming || !renameTitle.trim()}>
            {isRenaming ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("portal.chat.delete")}</DialogTitle>
          <DialogDescription>
            {t("portal.chat.deleteConfirm")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleDeleteChat()}
            disabled={isDeleting}
          >
            {isDeleting ? t("common.saving") : t("portal.chat.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

function Composer({
  input,
  setInput,
  onSubmit,
  status,
  t,
}: {
  input: string
  setInput: (value: string) => void
  onSubmit: () => void
  status: string
  t: (key: import("@/lib/i18n").TranslationKey) => string
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="relative"
    >
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("chat.inputPlaceholder")}
        rows={1}
        className="max-h-48 min-h-[52px] resize-none rounded-3xl border-border/70 bg-background py-3.5 pr-14 pl-4 shadow-sm"
      />
      <Button
        type="submit"
        size="icon"
        disabled={status === "streaming" || !input.trim()}
        className="absolute right-2.5 bottom-2.5 h-9 w-9 rounded-full"
        aria-label={t("chat.send")}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </form>
  )
}
