"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ShieldAlert } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function JobRiskGenerateButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()

  const pollJob = async (jobId: string) => {
    const startedAt = Date.now()
    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      await sleep(POLL_INTERVAL_MS)
      const response = await fetch(`/api/job-risk/jobs/${jobId}`)
      const data = (await response.json().catch(() => null)) as {
        status?: string
        error?: string | { message?: string }
      } | null

      if (!response.ok) {
        throw new Error(parseApiErrorMessage(data) ?? t("jobRisk.generate.error"))
      }

      if (data?.status === "ready") return
      if (data?.status === "failed") {
        const message =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || t("jobRisk.generate.error")
        throw new Error(message)
      }
    }
    throw new Error(t("jobRisk.generate.error"))
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/job-risk/generate", { method: "POST" })
      const data = (await response.json().catch(() => null)) as {
        success?: boolean
        jobId?: string
        status?: string
        error?: unknown
      } | null

      if (!response.ok) {
        setError(parseApiErrorMessage(data) ?? t("jobRisk.generate.error"))
        return
      }

      if (data?.success) {
        router.refresh()
        return
      }

      if (data?.jobId) {
        await pollJob(data.jobId)
        router.refresh()
        return
      }

      setError(t("jobRisk.generate.error"))
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobRisk.generate.error"))
    } finally {
      setIsLoading(false)
    }
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
