"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  Lightbulb, 
  ShieldAlert,
  MessagesSquare,
  Settings, 
  LogOut,
  User,
  Brain
} from "lucide-react"

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
    href: string
  }>
}

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/assessments", label: "Assessments", icon: FileText },
  { href: "/portal/opportunities", label: "Opportunities", icon: Lightbulb },
  { href: "/portal/job-risk", label: "Job Risk", icon: ShieldAlert },
  { href: "/portal/chat", label: "AI Advisor", icon: MessagesSquare },
]

export function PortalNav({ user, client, recentChats }: PortalNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="flex h-full w-full flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/portal" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">AI Readiness Portal</span>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <Link href="/" className="mb-3 block">
          <Button variant="outline" size="sm" className="w-full justify-start">
            Take Assessment
          </Button>
        </Link>

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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recently</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {recentChats.length > 0 ? (
              <div className="space-y-1">
                {recentChats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={chat.href}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No recent chats yet.
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
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
