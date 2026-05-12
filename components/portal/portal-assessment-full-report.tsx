"use client"

import { useMemo } from "react"
import { ExtendedReport } from "@/components/assessment/extended-report"
import { generateExtendedReport } from "@/lib/assessment-store"
import type { AssessmentResults } from "@/lib/types"

export function PortalAssessmentFullReport({ results }: { results: AssessmentResults }) {
  const extendedReport = useMemo(() => generateExtendedReport(results), [results])
  return <ExtendedReport extendedReport={extendedReport} results={results} />
}
