import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { requireAdmin } from "@/lib/auth/admin"
import { sql } from "@/lib/db"
import { OpportunityAddForm } from "@/components/portal/opportunity-add-form"
import { AdminCompanyProfileControls } from "@/components/admin/admin-company-profile-controls"
import { AdminGeneratePanel } from "@/components/admin/admin-generate-panel"
import { AdminIntelligenceCard } from "@/components/admin/admin-intelligence-card"
import { AdminOpportunityList, type AdminOpportunity } from "@/components/admin/admin-opportunity-list"

export const dynamic = "force-dynamic"

type ClientRow = {
  id: string
  company_name: string
  website: string | null
  description: string | null
  industry: string | null
  company_size: string | null
  contact_name: string | null
  contact_email: string
  account_email: string | null
  assessment_count: number
}

export default async function AdminCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await requireAdmin()
  if (!admin) return null

  const { id } = await params

  const rows = await sql<ClientRow[]>`
    select
      c.id, c.company_name, c.website, c.description, c.industry, c.company_size,
      c.contact_name, c.contact_email,
      u.email as account_email,
      (select count(*) from assessments a where a.client_id = c.id)::int as assessment_count
    from clients c
    left join app_users u on u.id = c.user_id
    where c.id = ${id}::uuid
    limit 1
  `
  const client = rows[0]
  if (!client) notFound()

  const opportunities = await sql<AdminOpportunity[]>`
    select
      id, title, description, department, priority, complexity, status, source,
      implementation_timeline, estimated_annual_savings, estimated_hours_saved_weekly,
      notes, pain_points, decision_makers, why_relevant, relevance_score,
      confidence_score, savings_assumptions, business_problem, proposed_solution,
      details, publication_status, published_at, updated_at
    from opportunities
    where client_id = ${client.id}
    order by
      case when publication_status = 'draft' then 0 else 1 end,
      priority asc,
      estimated_annual_savings desc
  `

  const intelligenceRows = await sql<
    Array<{ profile: Record<string, unknown>; source: string; updated_at: string }>
  >`
    select profile, source, updated_at
    from company_intelligence
    where client_id = ${client.id}
    limit 1
  `
  const intelligence = intelligenceRows[0] ?? null

  const hasAssessment = client.assessment_count > 0

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Companies
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {client.company_name || "Unnamed"}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {client.website ? (
            <a
              href={/^https?:\/\//i.test(client.website) ? client.website : `https://${client.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {client.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <span>{client.account_email || client.contact_email}</span>
        </div>
        {client.description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{client.description}</p>
        ) : null}
      </div>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile (feeds AI generation)
        </h2>
        <AdminCompanyProfileControls
          clientId={client.id}
          industry={client.industry}
          companySize={client.company_size}
        />
      </section>

      {!hasAssessment ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          This company has no assessment yet. AI generation needs one; you can still add opportunities
          manually.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminGeneratePanel clientId={client.id} disabled={!hasAssessment} />
        <OpportunityAddForm endpoint={`/api/admin/clients/${client.id}/opportunities`} />
      </div>

      {intelligence ? (
        <AdminIntelligenceCard
          profile={intelligence.profile}
          source={intelligence.source}
          updatedAt={intelligence.updated_at}
        />
      ) : null}

      <section id="opportunities" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Opportunities ({opportunities.length})</h2>
          <p className="text-sm text-muted-foreground">
            Review drafts in the exact client view, edit them, then publish when ready.
          </p>
        </div>
        <AdminOpportunityList clientId={client.id} opportunities={opportunities} />
      </section>
    </div>
  )
}
