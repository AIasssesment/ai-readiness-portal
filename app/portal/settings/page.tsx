"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Building2, User, Mail, Users, Briefcase, Save, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"

interface Client {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string
  industry: string | null
  company_size: string | null
}

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Professional Services",
  "Real Estate",
  "Transportation",
  "Energy",
  "Other"
]

const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+"
]

export default function SettingsPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const { locale, setLocale, t } = useLanguage()
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    industry: "",
    company_size: ""
  })

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("clients")
        .select()
        .eq("user_id", user.id)
        .single()

      if (data) {
        setClient(data)
        setFormData({
          company_name: data.company_name || "",
          contact_name: data.contact_name || "",
          contact_email: data.contact_email || "",
          industry: data.industry || "",
          company_size: data.company_size || ""
        })
      }
      setLoading(false)
    }

    loadClient()
  }, [supabase])

  const handleSave = async () => {
    if (!client) return

    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from("clients")
      .update({
        company_name: formData.company_name,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email,
        industry: formData.industry || null,
        company_size: formData.company_size || null
      })
      .eq("id", client.id)

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handleLanguageChange = (nextLocale: "en" | "uk") => {
    setLocale(nextLocale)
    router.refresh()
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
          <Label htmlFor="site-language">{t("settings.language.siteLanguage")}</Label>
          <Select value={locale} onValueChange={(value) => handleLanguageChange(value as "en" | "uk")}>
            <SelectTrigger id="site-language" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="uk">Українська</SelectItem>
            </SelectContent>
          </Select>
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
              placeholder="email@company.com"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                {t("settings.industry")}
              </Label>
              <Select 
                value={formData.industry} 
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.industry.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {t("settings.companySize")}
              </Label>
              <Select 
                value={formData.company_size} 
                onValueChange={(value) => setFormData({ ...formData, company_size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.companySize.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {locale === "uk" ? `${size} співробітників` : `${size} employees`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
