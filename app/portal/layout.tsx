import Link from "next/link"
import { redirect } from "next/navigation"
import { Brain } from "lucide-react"
import { createClient } from "@/lib/db-client/server"
import { PortalNav } from "@/components/portal/portal-nav"
import { MobilePortalNav } from "@/components/portal/mobile-portal-nav"
import { LanguageProvider } from "@/components/language-provider"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"
import { getSessionUserRole } from "@/lib/auth/admin"
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

type AssessmentNavRow = {
  id: string
  created_at: string
  overall_score: number
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
  const userRole = await getSessionUserRole()
  const isAdmin = userRole === "admin"

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

  // Latest assessments for the sidebar (max 4, "All" links to the full list).
  const recentAssessments =
    typedClient
      ? await sql<AssessmentNavRow[]>`
          select id, created_at, overall_score
          from assessments
          where client_id = ${typedClient.id}
          order by created_at desc
          limit 4
        `
      : []

  const recentAssessmentsForNav = recentAssessments.map((assessment) => ({
    id: assessment.id,
    score: assessment.overall_score,
    label: new Date(assessment.created_at).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    href: `/portal/assessments/${assessment.id}`,
  }))

  return (
    <LanguageProvider initialLocale={locale}>
    <div className="min-h-screen overflow-x-hidden bg-muted/30 md:flex md:h-screen md:overflow-hidden">
      <div className="hidden h-screen w-[280px] shrink-0 md:block">
        <PortalNav
          user={user}
          client={typedClient}
          profileDisplayName={profileDisplayName}
          recentChats={recentChatsForNav}
          recentAssessments={recentAssessmentsForNav}
          isAdmin={isAdmin}
        />
      </div>

      <div className="min-w-0 max-w-full flex-1 overflow-x-hidden md:h-screen md:overflow-y-auto">
        <div className="sticky top-0 z-30 border-b bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between gap-2">
            <Link href="/portal" className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <span className="truncate text-sm font-semibold">{t(locale, "portal.title")}</span>
            </Link>
            <MobilePortalNav
              user={user}
              client={typedClient}
              profileDisplayName={profileDisplayName}
              recentChats={recentChatsForNav}
              recentAssessments={recentAssessmentsForNav}
              isAdmin={isAdmin}
            />
          </div>
        </div>
        <main className="w-full min-w-0 max-w-full px-4 py-6 sm:py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
    </LanguageProvider>
  )
}
