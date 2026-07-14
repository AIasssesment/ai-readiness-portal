"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Sparkles } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function OpportunitiesGenerateButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    const response = await fetch("/api/opportunities/generate", { method: "POST" })
    setIsLoading(false)

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error || t("opps.generate.error"))
      return
    }
    router.refresh()
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lightbulb className="h-5 w-5 text-primary" />
          {t("opps.generate.title")}
        </CardTitle>
        <CardDescription>{t("opps.generate.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleGenerate} disabled={isLoading} className="h-11 w-full gap-2">
          <Sparkles className="h-4 w-4" />
          {isLoading ? t("opps.generate.loading") : t("opps.generate.action")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("opps.generate.preamble")}</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
