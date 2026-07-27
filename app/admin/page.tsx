import { requireAdmin } from "@/lib/auth/admin"
import { sql } from "@/lib/db"
import { AdminCompaniesTable, type AdminCompany } from "@/components/admin/admin-companies-table"
import { getServerLocale } from "@/lib/i18n-server"
import { t } from "@/lib/i18n"

export const dynamic = "force-dynamic"

export default async function AdminCompaniesPage() {
  const admin = await requireAdmin()
  if (!admin) return null

  const locale = await getServerLocale()

  const companies = await sql<AdminCompany[]>`
    select
      c.id,
      c.company_name,
      c.website,
      c.description,
      c.industry,
      c.company_size,
      c.contact_name,
      c.contact_email,
      c.created_at,
      u.email as account_email,
      (select count(*) from assessments a where a.client_id = c.id)::int as assessment_count,
      (select count(*) from opportunities o where o.client_id = c.id)::int as opportunity_count
    from clients c
    left join app_users u on u.id = c.user_id
    order by c.created_at desc
  `

  const pendingCount = companies.filter((c) => !c.industry || !c.company_size).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(locale, "admin.companiesTitle")}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">{t(locale, "admin.companiesSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t(locale, "admin.stat.total")} value={companies.length} />
        <StatCard label={t(locale, "admin.stat.missing")} value={pendingCount} />
        <StatCard
          label={t(locale, "admin.stat.assessed")}
          value={companies.filter((c) => c.assessment_count > 0).length}
        />
      </div>

      <AdminCompaniesTable companies={companies} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}
