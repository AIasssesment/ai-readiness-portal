"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ShieldAlert } from "lucide-react"

export function JobRiskGenerateButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    const response = await fetch("/api/job-risk/generate", { method: "POST" })
    setIsLoading(false)

    if (!response.ok) {
      setError("Could not generate the report right now. Please try again.")
      return
    }
    router.refresh()
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Job Risk AI Advisor
        </CardTitle>
        <CardDescription>
          Generate a role-by-role disruption report with risk scores, timelines, and practical reskilling steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleGenerate} disabled={isLoading} className="h-11 w-full gap-2">
          <Sparkles className="h-4 w-4" />
          {isLoading ? "Generating Report..." : "Generate Job Risk Report"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
