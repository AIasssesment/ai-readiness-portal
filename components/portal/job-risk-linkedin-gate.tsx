"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Linkedin, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"

export function JobRiskLinkedinGate({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter()
  const { t } = useLanguage()
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!value.trim()) {
      setError(t("jobRisk.linkedin.required"))
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/job-risk/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin: value }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(parseApiErrorMessage(data) ?? t("jobRisk.linkedin.error"))
        return
      }
      router.refresh()
    } catch {
      setError(t("jobRisk.linkedin.error"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-primary" />
          {t("jobRisk.linkedin.title")}
        </CardTitle>
        <CardDescription>{t("jobRisk.linkedin.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("jobRisk.linkedin.placeholder")}
          onKeyDown={(event) => {
            if (event.key === "Enter") void save()
          }}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {t("jobRisk.linkedin.save")}
          </Button>
          <Link href="/portal/settings" className="text-sm text-muted-foreground hover:text-foreground">
            {t("jobRisk.linkedin.editInSettings")}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
