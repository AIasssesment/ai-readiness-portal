"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import {
  formatAssumptionsCaption,
  formatCompactUsd,
  type OpportunityDetails,
  type SavingsAssumptions,
} from "@/lib/opportunities/savings"
import { Building2, Clock, Gauge } from "lucide-react"

export type OpportunityCardData = {
  id: string
  title: string
  description: string | null
  priority: string
  complexity: string
  department: string | null
  status: string
  implementation_timeline: string | null
  estimated_annual_savings: string | number | null
  estimated_hours_saved_weekly: number | string | null
  notes: string | null
  source?: string | null
  why_relevant?: string | null
  savings_assumptions?: SavingsAssumptions | Record<string, unknown> | null
  business_problem?: string | null
  proposed_solution?: string | null
  pain_points?: unknown
  decision_makers?: unknown
  details?: OpportunityDetails | Record<string, unknown> | null
}

export function OpportunityCard({ opportunity }: { opportunity: OpportunityCardData }) {
  const { t } = useLanguage()
  const annual = parseFloat(String(opportunity.estimated_annual_savings ?? 0)) || 0
  const assumptions = opportunity.savings_assumptions as SavingsAssumptions | undefined
  const assumptionsCaption = formatAssumptionsCaption(assumptions)
  const details = parseDetails(opportunity.details)
  const decisionMakers = asStringList(opportunity.decision_makers)
  const painPoints = asStringList(opportunity.pain_points)
  const hasDetails =
    Boolean(details.expected_roi) ||
    Boolean(details.savings_confidence) ||
    (details.capabilities?.length ?? 0) > 0 ||
    (details.integrations?.length ?? 0) > 0 ||
    (details.evidence?.length ?? 0) > 0 ||
    decisionMakers.length > 0 ||
    painPoints.length > 0

  return (
    <Card className="group overflow-hidden border-border/70 bg-gradient-to-b from-slate-950/95 to-slate-900/90 shadow-[0_0_0_1px_rgba(148,163,184,0.15)] backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.35)]">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                  opportunity.priority === "high"
                    ? "bg-red-500"
                    : opportunity.priority === "medium"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-xl font-semibold tracking-tight text-slate-100 transition-colors group-hover:text-white sm:text-2xl">
                  {opportunity.title}
                </h3>
                {opportunity.description ? (
                  <p className="mt-1 text-sm text-slate-300/90 sm:text-base">
                    {opportunity.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={`font-medium ${getPriorityColor(opportunity.priority)}`}
              >
                {opportunity.priority} {t("opps.priority")}
              </Badge>
              <Badge
                variant="outline"
                className={`font-medium ${getComplexityColor(opportunity.complexity)}`}
              >
                <Gauge className="mr-1 h-3 w-3" />
                {opportunity.complexity} {t("opps.complexity")}
              </Badge>
              {opportunity.department ? (
                <Badge
                  variant="outline"
                  className="border-slate-400/30 bg-slate-700/30 text-slate-200"
                >
                  <Building2 className="mr-1 h-3 w-3" />
                  {opportunity.department}
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className={`font-medium ${getStatusColor(opportunity.status)}`}
              >
                {opportunity.status.replace(/_/g, " ")}
              </Badge>
              {opportunity.source ? (
                <Badge
                  variant="outline"
                  className="border-slate-400/30 bg-slate-700/20 text-slate-300"
                >
                  {opportunity.source}
                </Badge>
              ) : null}
            </div>

            {opportunity.implementation_timeline ? (
              <p className="text-sm text-slate-300/80">
                <Clock className="mr-1 inline h-3.5 w-3.5" />
                {t("opps.timelinePrefix")} {opportunity.implementation_timeline}
              </p>
            ) : null}

            {opportunity.why_relevant ? (
              <p className="text-sm text-slate-300/90">
                <strong>{t("opps.whyRelevant")}</strong> {opportunity.why_relevant}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-slate-700/70 pt-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <div className="break-words text-3xl font-bold tracking-tight text-emerald-400 sm:text-5xl">
                {formatCompactUsd(annual)}
              </div>
              <div className="text-base text-slate-300/80 sm:text-xl">
                {t("opps.estAnnualSavings")}
              </div>
              {assumptionsCaption ? (
                <p className="text-xs text-slate-400/90">
                  {t("opps.assumptions")}: {assumptionsCaption}
                </p>
              ) : null}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="break-words text-3xl font-bold tracking-tight text-slate-100 sm:text-5xl">
                {(
                  parseFloat(String(opportunity.estimated_hours_saved_weekly ?? 0)) || 0
                ).toLocaleString()}{" "}
                {t("opps.hrsWeek")}
              </div>
              <div className="text-base text-slate-300/80 sm:text-xl">{t("opps.timeSavings")}</div>
            </div>
          </div>
        </div>

        {hasDetails ? (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-600/50 bg-slate-800/40 p-4">
            {details.expected_roi ? (
              <p className="text-sm text-slate-300/90">
                <strong>{t("opps.expectedRoi")}</strong> {details.expected_roi}
                {details.savings_confidence
                  ? ` · ${t("opps.savingsConfidence")}: ${details.savings_confidence}`
                  : ""}
              </p>
            ) : details.savings_confidence ? (
              <p className="text-sm text-slate-300/90">
                <strong>{t("opps.savingsConfidence")}:</strong> {details.savings_confidence}
              </p>
            ) : null}
            <BadgeList title={t("opps.decisionMakers")} items={decisionMakers} />
            <BulletList title={t("opps.painPoints")} items={painPoints} />
            <BadgeList title={t("opps.capabilities")} items={details.capabilities ?? []} tone="teal" />
            <BadgeList
              title={t("opps.integrations")}
              items={details.integrations ?? []}
              tone="indigo"
            />
            <BulletList title={t("opps.evidence")} items={details.evidence ?? []} />
          </div>
        ) : null}

        {opportunity.notes ? (
          <div className="mt-4 rounded-lg border border-slate-600/50 bg-slate-800/40 p-3">
            <p className="text-sm text-slate-300/90">
              <strong>{t("opps.notes")}</strong> {opportunity.notes}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function BadgeList({
  title,
  items,
  tone = "slate",
}: {
  title: string
  items: string[]
  tone?: "slate" | "teal" | "indigo"
}) {
  if (!items.length) return null
  const color =
    tone === "teal"
      ? "border-teal-500/30 bg-teal-950/30 text-teal-100"
      : tone === "indigo"
        ? "border-indigo-500/30 bg-indigo-950/30 text-indigo-100"
        : "border-slate-500/40 bg-slate-900/40 text-slate-200"
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-200">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item} variant="outline" className={color}>
            {item}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-200">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300/90">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item ?? "").trim()).filter(Boolean)
}

function parseDetails(value: unknown): OpportunityDetails {
  if (!value || typeof value !== "object") return {}
  const row = value as OpportunityDetails
  return {
    expected_roi: row.expected_roi,
    savings_confidence: row.savings_confidence,
    capabilities: asStringList(row.capabilities),
    integrations: asStringList(row.integrations),
    evidence: asStringList(row.evidence),
  }
}

function getPriorityColor(priority: string) {
  if (priority === "high") return "border-red-500/30 bg-red-500/15 text-red-200"
  if (priority === "medium") return "border-amber-500/30 bg-amber-500/15 text-amber-200"
  if (priority === "low") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
  return "border-slate-500/30 bg-slate-500/15 text-slate-200"
}

function getComplexityColor(complexity: string) {
  if (complexity === "high") return "border-purple-500/30 bg-purple-500/15 text-purple-200"
  if (complexity === "medium") return "border-blue-500/30 bg-blue-500/15 text-blue-200"
  if (complexity === "low") return "border-green-500/30 bg-green-500/15 text-green-200"
  return "border-slate-500/30 bg-slate-500/15 text-slate-200"
}

function getStatusColor(status: string) {
  if (status === "completed") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
  if (status === "in_progress") return "border-blue-500/30 bg-blue-500/15 text-blue-200"
  if (status === "approved") return "border-purple-500/30 bg-purple-500/15 text-purple-200"
  if (status === "in_review") return "border-amber-500/30 bg-amber-500/15 text-amber-200"
  if (status === "rejected") return "border-red-500/30 bg-red-500/15 text-red-200"
  return "border-slate-500/30 bg-slate-500/15 text-slate-200"
}
