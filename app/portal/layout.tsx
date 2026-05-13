import { redirect } from "next/navigation"
import { createClient } from "@/lib/db-client/server"
import { PortalNav } from "@/components/portal/portal-nav"
import { MobilePortalNav } from "@/components/portal/mobile-portal-nav"
import { LanguageProvider } from "@/components/language-provider"
import { getServerLocale } from "@/lib/i18n-server"
import { sql } from "@/lib/db"

type Client = {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string
}

type ConversationRow = {
  id: string
  title: string
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getServerLocale()
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Get client info
  const { data: client } = await db
    .from("clients")
    .select()
    .eq("user_id", user.id)
    .single()
  const typedClient = (client ?? null) as unknown as Client | null

  const appUserRows = await sql<Array<{ full_name: string | null }>>`
    select full_name
    from app_users
    where id = ${user.id}::uuid
    limit 1
  `
  const fullNameFromAccount = appUserRows[0]?.full_name?.trim() || null
  const contactFromClient = typedClient?.contact_name?.trim() || null
  const profileDisplayName = contactFromClient || fullNameFromAccount || null

  const recentChats =
    typedClient
      ? await sql<ConversationRow[]>`
          select id, title
          from conversations
          where client_id = ${typedClient.id}
          order by (title like '★ %') desc, updated_at desc
          limit 20
        `
      : []

  const recentChatsForNav = recentChats.map((chat) => ({
    id: chat.id,
    title: chat.title.replace(/^★\s+/, ""),
    rawTitle: chat.title,
    isStarred: chat.title.startsWith("★ "),
    href: `/portal/chat?conversationId=${chat.id}`,
  }))

  return (
    <LanguageProvider initialLocale={locale}>
    <div className="min-h-screen bg-muted/30 md:flex md:h-screen md:overflow-hidden">
      <div className="hidden h-screen w-[280px] shrink-0 md:block">
        <PortalNav user={user} client={typedClient} profileDisplayName={profileDisplayName} recentChats={recentChatsForNav} />
      </div>

      <div className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <div className="border-b bg-background px-4 py-3 md:hidden">
          <div className="flex items-center justify-end">
            <MobilePortalNav user={user} client={typedClient} profileDisplayName={profileDisplayName} recentChats={recentChatsForNav} />
          </div>
        </div>
        <main className="px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
    </LanguageProvider>
  )
}
