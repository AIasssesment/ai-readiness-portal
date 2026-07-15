"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuestionCard } from "@/components/assessment/question-card"
import { AnalyzingScreen } from "@/components/assessment/analyzing-screen"
import { BasicResults } from "@/components/assessment/basic-results"
import { ExtendedReportUpsell } from "@/components/assessment/extended-report-upsell"
import { UnlockReportButton } from "@/components/portal/unlock-report-button"
import { PortalCompanyProfileStep } from "@/components/portal/portal-company-profile-step"
import { useAssessmentStore } from "@/lib/assessment-store"
import { useLanguage } from "@/components/language-provider"
import type { CompanyInfo } from "@/lib/types"

type PortalAssessmentFlowProps = {
  clientId?: string
  companyName: string
  contactName: string | null
  contactEmail: string
  industry?: string | null
  companySize?: string | null
  website?: string | null
  description?: string | null
}

function parseContactName(name: string | null): Pick<CompanyInfo, "firstName" | "lastName"> {
  const trimmed = (name || "").trim()
  if (!trimmed) return { firstName: "", lastName: "" }

  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  }
}

function isProfileIncomplete(industry?: string | null, description?: string | null) {
  return !industry?.trim() || !description?.trim()
}

export function PortalAssessmentFlow({
  clientId,
  companyName,
  contactName,
  contactEmail,
  industry,
  companySize,
  website,
  description,
}: PortalAssessmentFlowProps) {
  const { t } = useLanguage()
  const step = useAssessmentStore((state) => state.step)
  const reset = useAssessmentStore((state) => state.reset)
  const setCompanyInfo = useAssessmentStore((state) => state.setCompanyInfo)
  const companyInfo = useAssessmentStore((state) => state.companyInfo)
  const hasPurchasedExtended = useAssessmentStore((state) => state.hasPurchasedExtended)
  const results = useAssessmentStore((state) => state.results)

  const [needsProfile, setNeedsProfile] = useState(() =>
    isProfileIncomplete(industry, description),
  )

  useEffect(() => {
    reset()
    const { firstName, lastName } = parseContactName(contactName)
    setCompanyInfo({
      firstName,
      lastName,
      companyName,
      email: contactEmail,
      industry: industry || "",
      employeeCount: companySize || "",
      website: website || "",
      description: description || "",
    })
    setNeedsProfile(isProfileIncomplete(industry, description))
  }, [
    companyName,
    companySize,
    contactEmail,
    contactName,
    description,
    industry,
    reset,
    setCompanyInfo,
    website,
  ])

  const seedCompanyInfo = (): CompanyInfo => {
    const { firstName, lastName } = parseContactName(contactName)
    return {
      firstName,
      lastName,
      companyName,
      email: contactEmail,
      industry: industry || "",
      employeeCount: companySize || "",
      website: website || "",
      description: description || "",
    }
  }

  const showProfileGate = needsProfile && (step === "questions" || step === "landing" || step === "info")

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {showProfileGate ? t("assessment.flow.step1Badge") : t("assessment.flow.step2Badge")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("assessments.newAssessment")}</h1>
        <p className="mt-2 text-muted-foreground">
          {showProfileGate ? t("portal.assessment.profile.pageHint") : t("assessments.subtitle")}
        </p>
      </div>

      {showProfileGate ? (
        <PortalCompanyProfileStep
          initial={companyInfo ?? seedCompanyInfo()}
          onContinue={(info) => {
            setCompanyInfo(info)
            setNeedsProfile(false)
          }}
        />
      ) : null}

      {!showProfileGate && step === "questions" ? <QuestionCard /> : null}

      {step === "analyzing" ? (
        <div className="mx-auto max-w-lg">
          <AnalyzingScreen />
        </div>
      ) : null}

      {step === "results" ? (
        <div className="space-y-8">
          <BasicResults />

          {hasPurchasedExtended ? null : clientId && results?.savedAssessmentId ? (
            <UnlockReportButton
              label={t("assessments.unlockReport")}
              clientId={clientId}
              assessmentId={results.savedAssessmentId}
              mode="charge_and_manual"
              className="w-full gap-2"
            />
          ) : (
            <ExtendedReportUpsell />
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {results?.savedAssessmentId ? (
              <Link href={`/portal/assessments/${results.savedAssessmentId}`}>
                <Button className="gap-2">
                  {t("assessments.viewReport")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}

            <Link href="/portal/assessments">
              <Button variant="outline">{t("assessmentDetail.backToAssessments")}</Button>
            </Link>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground"
              onClick={() => {
                reset()
                const info = seedCompanyInfo()
                setCompanyInfo(info)
                setNeedsProfile(isProfileIncomplete(info.industry, info.description))
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              {t("assessments.newAssessment")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
