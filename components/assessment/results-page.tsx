"use client"

import { RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAssessmentStore } from "@/lib/assessment-store"
import { BasicResults } from "./basic-results"
import { ExtendedReportUpsell } from "./extended-report-upsell"
import { ExtendedReport } from "./extended-report"

export function ResultsPage() {
  const hasPurchasedExtended = useAssessmentStore((state) => state.hasPurchasedExtended)
  const reset = useAssessmentStore((state) => state.reset)

  return (
    <div className="space-y-8">
      {/* Basic Results - Always shown */}
      <BasicResults />

      {/* Extended Report Section */}
      {hasPurchasedExtended ? <ExtendedReport /> : <ExtendedReportUpsell />}

      {/* Reset Button */}
      <div className="pt-8 text-center">
        <Button
          variant="ghost"
          onClick={reset}
          className="gap-2 font-[family-name:var(--font-display)] text-muted-foreground hover:text-foreground"
        >
          <RefreshCcw className="h-4 w-4" />
          Start New Assessment
        </Button>
      </div>
    </div>
  )
}
