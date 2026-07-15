"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/db-client/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ArrowRight } from "lucide-react"
import { EMPLOYEE_RANGES, INDUSTRIES } from "@/lib/assessment-data"
import { normalizeCompanyWebsiteInput } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import type { CompanyInfo } from "@/lib/types"

type PortalCompanyProfileStepProps = {
  initial: CompanyInfo
  onContinue: (info: CompanyInfo) => void
}

export function PortalCompanyProfileStep({ initial, onContinue }: PortalCompanyProfileStepProps) {
  const { t } = useLanguage()
  const db = useMemo(() => createClient(), [])
  const [form, setForm] = useState({
    companyName: initial.companyName || "",
    website: initial.website || "",
    industry: initial.industry || "",
    employeeCount: initial.employeeCount || "",
    description: initial.description || "",
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleContinue = async () => {
    const website = form.website.trim()
      ? normalizeCompanyWebsiteInput(form.website.trim())
      : ""
    const industry = form.industry.trim()
    const employeeCount = form.employeeCount.trim()
    const description = form.description.trim()
    const companyName = form.companyName.trim() || initial.companyName

    if (!industry || !description || !employeeCount) {
      setError(t("portal.assessment.profile.errorRequired"))
      return
    }

    setError(null)
    setSaving(true)

    const next: CompanyInfo = {
      ...initial,
      companyName,
      website,
      industry,
      employeeCount,
      description,
    }

    const { data: { user } } = await db.auth.getUser()
    if (user) {
      const { error: updateError } = await db
        .from("clients")
        .update({
          company_name: companyName,
          industry,
          company_size: employeeCount,
          website: website || null,
          description,
        })
        .eq("user_id", user.id)

      if (updateError) {
        setSaving(false)
        setError(t("portal.assessment.profile.saveFailed"))
        return
      }
    }

    setSaving(false)
    onContinue(next)
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("assessment.flow.step1Badge")}
        </p>
        <CardTitle className="mt-2">{t("portal.assessment.profile.title")}</CardTitle>
        <CardDescription>{t("portal.assessment.profile.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="portal-company-name">{t("settings.company.name")}</Label>
          <Input
            id="portal-company-name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder={t("settings.company.namePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="portal-website">{t("settings.website")}</Label>
          <Input
            id="portal-website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder={t("settings.website.placeholder")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("settings.industry")} *</Label>
            <Select
              value={form.industry || undefined}
              onValueChange={(value) => setForm({ ...form, industry: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("settings.industry.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("settings.companySize")} *</Label>
            <Select
              value={form.employeeCount || undefined}
              onValueChange={(value) => setForm({ ...form, employeeCount: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("settings.companySize.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_RANGES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} {t("settings.companySize.suffix")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="portal-description">{t("settings.whatYouDo")} *</Label>
          <Textarea
            id="portal-description"
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t("settings.whatYouDo.placeholder")}
          />
          <p className="text-xs text-muted-foreground">{t("settings.whatYouDo.hint")}</p>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Button onClick={() => void handleContinue()} disabled={saving} className="w-full gap-2">
          {saving ? <Spinner className="h-4 w-4" /> : null}
          {saving ? t("common.saving") : t("portal.assessment.profile.continue")}
          {!saving ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </CardContent>
    </Card>
  )
}
