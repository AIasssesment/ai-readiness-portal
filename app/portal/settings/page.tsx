"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/db-client/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Building2, User, Mail, Save, CheckCircle, Globe2, Linkedin } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { LocaleToggle } from "@/components/locale-toggle"
import { normalizeCompanyWebsiteInput, normalizeLinkedInInput } from "@/lib/utils"

interface Client {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string
  website: string | null
  linkedin: string | null
}

export default function SettingsPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    website: "",
    linkedin: "",
  })

  const db = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return

      const { data } = await db
        .from("clients")
        .select()
        .eq("user_id", user.id)
        .single()

      if (data) {
        const row = data as Client
        setClient(row)
        setFormData({
          company_name: row.company_name || "",
          contact_name: row.contact_name || "",
          contact_email: row.contact_email || "",
          website: row.website || "",
          linkedin: row.linkedin || "",
        })
      }
      setLoading(false)
    }

    loadClient()
  }, [db])

  const handleSave = async () => {
    if (!client) return

    setSaving(true)
    setSaved(false)

    const websiteRaw = formData.website.trim()
    const website = websiteRaw ? normalizeCompanyWebsiteInput(websiteRaw) : null
    const linkedinRaw = formData.linkedin.trim()
    const linkedin = linkedinRaw ? normalizeLinkedInInput(linkedinRaw) : null

    const { error } = await db
      .from("clients")
      .update({
        company_name: formData.company_name,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email,
        website,
        linkedin,
      })
      .eq("id", client.id)

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language.title")}</CardTitle>
          <CardDescription>
            {t("settings.language.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>{t("settings.language.siteLanguage")}</Label>
          <LocaleToggle className="max-w-xs" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("settings.company.title")}
          </CardTitle>
          <CardDescription>
            {t("settings.company.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {t("settings.company.name")}
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder={t("settings.company.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              {t("settings.website")}
            </Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder={t("settings.website.placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-muted-foreground" />
              {t("settings.linkedin")}
            </Label>
            <Input
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder={t("settings.linkedin.placeholder")}
            />
            <p className="text-xs text-muted-foreground">{t("settings.linkedin.hint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {t("settings.contact.name")}
            </Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              placeholder={t("settings.contact.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {t("settings.contact.email")}
            </Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder={t("settings.contact.emailPlaceholder")}
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Spinner className="h-4 w-4" />
              ) : saved ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? t("common.saving") : saved ? t("settings.saved") : t("settings.saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
