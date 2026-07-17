"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Loader2, Check, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"

const BENEFIT_KEYS = [
  "jobRisk.unlock.benefit1",
  "jobRisk.unlock.benefit2",
  "jobRisk.unlock.benefit3",
] as const

export function JobRiskUnlockGate() {
  const router = useRouter()
  const { t } = useLanguage()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unlock = async () => {
    setIsProcessing(true)
    setError(null)
    try {
      const response = await fetch("/api/job-risk/checkout", { method: "POST" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(parseApiErrorMessage(data) ?? t("jobRisk.unlock.error"))
        return
      }
      router.refresh()
    } catch {
      setError(t("jobRisk.unlock.error"))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          {t("jobRisk.unlock.title")}
        </CardTitle>
        <CardDescription>{t("jobRisk.unlock.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between rounded-xl bg-secondary p-4">
          <span className="font-semibold">{t("jobRisk.unlock.priceLabel")}</span>
          <span className="text-lg font-bold text-primary">$49.00</span>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button onClick={unlock} disabled={isProcessing} className="h-11 w-full gap-2">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {isProcessing ? t("jobRisk.unlock.processing") : t("jobRisk.unlock.cta")}
        </Button>
      </CardContent>
    </Card>
  )
}
