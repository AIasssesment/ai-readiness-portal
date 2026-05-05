"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import { 
  LayoutDashboard, 
  FileText, 
  Lightbulb, 
  ShieldAlert,
  MessagesSquare,
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  Settings, 
  LogOut,
  User,
  Brain
} from "lucide-react"
import { useMemo, useState } from "react"

type AuthUser = {
  id: string
  email: string
}

interface Client {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string
}

interface PortalNavProps {
  user: AuthUser
  client: Client | null
  recentChats: Array<{
    id: string
    title: string
    rawTitle: string
    isStarred: boolean
    href: string
  }>
  onNavigate?: () => void
}

export function PortalNav({ user, client, recentChats, onNavigate }: PortalNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const activeConversationId = searchParams.get("conversationId")
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameChatId, setRenameChatId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [chatSearch, setChatSearch] = useState("")
  const { t } = useLanguage()
  const filteredChats = useMemo(() => {
    const query = chatSearch.trim().toLowerCase()
    if (!query) return recentChats
    return recentChats.filter((chat) => chat.title.toLowerCase().includes(query))
  }, [chatSearch, recentChats])
  const navItems = [
    { href: "/portal", label: t("portal.nav.dashboard"), icon: LayoutDashboard },
    { href: "/portal/assessments", label: t("portal.nav.assessments"), icon: FileText },
    { href: "/portal/opportunities", label: t("portal.nav.opportunities"), icon: Lightbulb },
    { href: "/portal/workforce", label: t("portal.nav.workforce"), icon: Users },
    { href: "/portal/job-risk", label: t("portal.nav.jobRisk"), icon: ShieldAlert },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleCreateChat = async () => {
    setIsCreatingChat(true)
    try {
      const response = await fetch("/api/chat/conversations", { method: "POST" })
      if (response.ok) {
        const payload = (await response.json()) as { id?: string } 
        if (payload.id) {
          router.push(`/portal/chat?conversationId=${payload.id}`)
          onNavigate?.()
          router.refresh()
          return
        }
      }

      // Fallback: open chat page even if conversation creation endpoint fails.
      router.push("/portal/chat")
      onNavigate?.()
    } catch {
      router.push("/portal/chat")
      onNavigate?.()
    } finally {
      setIsCreatingChat(false)
    }
  }

  const openRenameDialog = (chatId: string, currentTitle: string) => {
    setRenameChatId(chatId)
    setRenameTitle(currentTitle.replace(/^★\s+/, ""))
    setRenameDialogOpen(true)
  }

  const handleRenameChat = async () => {
    if (!renameChatId) return
    const nextTitle = renameTitle.trim()
    if (!nextTitle) return

    setIsRenaming(true)
    const response = await fetch(`/api/chat/conversations/${renameChatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    })
    setIsRenaming(false)
    if (!response.ok) return

    setRenameDialogOpen(false)
    setRenameChatId(null)
    setRenameTitle("")
    router.refresh()
  }

  const openDeleteDialog = (chatId: string) => {
    setDeleteChatId(chatId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteChat = async () => {
    if (!deleteChatId) return

    setIsDeleting(true)
    const response = await fetch(`/api/chat/conversations/${deleteChatId}`, {
      method: "DELETE",
    })
    setIsDeleting(false)
    if (!response.ok) return

    if (activeConversationId === deleteChatId) {
      router.push("/portal/chat")
    }
    setDeleteDialogOpen(false)
    setDeleteChatId(null)
    router.refresh()
  }

  const handleToggleStar = async (chatId: string, rawTitle: string, isStarred: boolean) => {
    const cleaned = rawTitle.replace(/^★\s+/, "")
    const nextTitle = isStarred ? cleaned : `★ ${cleaned}`
    const response = await fetch(`/api/chat/conversations/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    })
    if (!response.ok) return
    router.refresh()
  }

  return (
    <aside className="flex h-full w-full flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/portal" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden font-semibold md:inline">{t("portal.title")}</span>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <Link href="/" className="mb-3 block">
          <Button variant="outline" size="sm" className="w-full justify-start">
            {t("portal.takeAssessment")}
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          className="mt-3 mb-2 justify-start"
          onClick={handleCreateChat}
          disabled={isCreatingChat}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("portal.createChat")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="mb-3 hidden justify-start md:flex"
          onClick={() => setSearchDialogOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          {t("portal.chat.searchPlaceholder")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="mb-3 justify-start md:hidden"
          onClick={() => {
            router.push("/portal/chat?openSearch=1")
            onNavigate?.()
          }}
        >
          <Search className="mr-2 h-4 w-4" />
          {t("portal.chat.searchPlaceholder")}
        </Button>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== "/portal" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>


        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-md border bg-muted/20">
          <div className="border-b px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("portal.recently")}
            </p>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {recentChats.length > 0 ? (
              <div className="space-y-1">
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-md px-1 py-0.5",
                      activeConversationId === chat.id && "bg-muted",
                    )}
                  >
                    <Link
                      href={chat.href}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{chat.title}</span>
                      {chat.isStarred ? (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500" />
                      ) : null}
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => openRenameDialog(chat.id, chat.rawTitle)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("portal.chat.rename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStar(chat.id, chat.rawTitle, chat.isStarred)}>
                          <Star className="mr-2 h-4 w-4" />
                          {chat.isStarred ? t("portal.chat.unstar") : t("portal.chat.star")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(chat.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("portal.chat.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                {t("portal.chat.noRecent")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="max-w-40 truncate">
                {client?.company_name || user.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{client?.company_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/portal/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                {t("portal.settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("portal.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false)
                setRenameChatId(null)
                setRenameTitle("")
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRenameChat} disabled={isRenaming || !renameTitle.trim()}>
              {isRenaming ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeleteChatId(null)
        }}
      >
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
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteChatId(null)
              }}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChat}
              disabled={isDeleting || !deleteChatId}
            >
              {isDeleting ? t("common.saving") : t("portal.chat.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("portal.chat.searchPlaceholder")}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={chatSearch}
            onChange={(event) => setChatSearch(event.target.value)}
            placeholder={t("portal.chat.searchPlaceholder")}
          />
          <div className="max-h-[55vh] overflow-y-auto rounded-md border bg-muted/20 p-2">
            <Link
              href="/portal/chat"
              onClick={() => setSearchDialogOpen(false)}
              className="mb-1 flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
              {t("portal.createChat")}
            </Link>
            {filteredChats.length > 0 ? (
              <div className="space-y-1">
                {filteredChats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={chat.href}
                    onClick={() => setSearchDialogOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                    {chat.isStarred ? (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500" />
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                {chatSearch.trim() ? t("portal.chat.noSearchResults") : t("portal.chat.noRecent")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
