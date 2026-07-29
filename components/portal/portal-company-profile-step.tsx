"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/db-client/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ArrowRight } from "lucide-react"
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
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleContinue = async () => {
    const website = form.website.trim()
      ? normalizeCompanyWebsiteInput(form.website.trim())
      : ""
    const companyName = form.companyName.trim() || initial.companyName

    if (!companyName.trim()) {
      setError(t("portal.assessment.profile.errorRequired"))
      return
    }

    setError(null)
    setSaving(true)

    const next: CompanyInfo = {
      ...initial,
      companyName,
      website,
    }

    const { data: { user } } = await db.auth.getUser()
    if (user) {
      const { error: updateError } = await db
        .from("clients")
        .update({
          company_name: companyName,
          website: website || null,
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
