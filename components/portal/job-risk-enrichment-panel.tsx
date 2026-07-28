import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Briefcase, AlertCircle } from "lucide-react"
import { t, type Locale } from "@/lib/i18n"
import { fetchCompanyEnrichment } from "@/lib/api/job-risk"

type EnrichmentSnapshot = {
  status: string
  linkedin_url: string
  error: string | null
  fetched_at: string | null
  company_name: string | null
  about: string | null
  jobs_count: number
  roles_count: number
}

export async function JobRiskEnrichmentPanel({
  clientId,
  locale,
}: {
  clientId: string
  locale: Locale
}) {
  const { enrichment } = await fetchCompanyEnrichment(clientId)

  if (!enrichment) {
    return (
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            {t(locale, "jobRisk.enrichment.title")}
          </CardTitle>
          <CardDescription>{t(locale, "jobRisk.enrichment.empty")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const normalized = enrichment.normalized
  const snapshot: EnrichmentSnapshot = {
    status: enrichment.status,
    linkedin_url: enrichment.linkedinUrl,
    error: enrichment.error,
    fetched_at: enrichment.fetchedAt,
    company_name: normalized?.company?.name ?? null,
    about: normalized?.company?.about ?? null,
    jobs_count: Array.isArray(normalized?.detected_jobs) ? normalized!.detected_jobs!.length : 0,
    roles_count: Array.isArray(normalized?.implied_roles) ? normalized!.implied_roles!.length : 0,
  }

  const badgeClass =
    snapshot.status === "ready"
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
      : snapshot.status === "pending"
        ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
        : snapshot.status === "skipped"
          ? "border-border bg-muted/40 text-muted-foreground"
          : "border-red-500/30 bg-red-500/15 text-red-200"

  return (
    <Card className="border-border/40 bg-card/80">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            {t(locale, "jobRisk.enrichment.title")}
          </CardTitle>
          <Badge variant="outline" className={badgeClass}>
            {snapshot.status}
          </Badge>
        </div>
        <CardDescription className="break-all text-xs">{snapshot.linkedin_url}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {snapshot.company_name && (
          <p>
            <span className="text-muted-foreground">{t(locale, "jobRisk.enrichment.company")}: </span>
            {snapshot.company_name}
          </p>
        )}
        {snapshot.about && (
          <p className="line-clamp-4 text-muted-foreground">{snapshot.about}</p>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            {t(locale, "jobRisk.enrichment.jobs")}: {snapshot.jobs_count}
          </span>
          <span>
            {t(locale, "jobRisk.enrichment.roles")}: {snapshot.roles_count}
          </span>
          {snapshot.fetched_at && (
            <span>
              {t(locale, "jobRisk.enrichment.fetched")}: {new Date(snapshot.fetched_at).toLocaleString()}
            </span>
          )}
        </div>
        {snapshot.error && (
          <p className="flex items-start gap-1.5 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {snapshot.error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
