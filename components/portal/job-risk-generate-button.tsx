"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ShieldAlert } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function JobRiskGenerateButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    const response = await fetch("/api/job-risk/generate", { method: "POST" })
    setIsLoading(false)

    if (!response.ok) {
      setError(t("jobRisk.generate.error"))
      return
    }
    router.refresh()
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldAlert className="h-5 w-5 text-primary" />
          {t("jobRisk.generate.title")}
        </CardTitle>
        <CardDescription>
          {t("jobRisk.generate.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleGenerate} disabled={isLoading} className="h-11 w-full gap-2">
          <Sparkles className="h-4 w-4" />
          {isLoading ? t("jobRisk.generate.loading") : t("jobRisk.generate.action")}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
