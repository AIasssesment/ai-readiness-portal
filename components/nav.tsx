"use client"

import { Button } from "@/components/ui/button"
import { useAssessmentStore } from "@/lib/assessment-store"

export function Nav() {
  const step = useAssessmentStore((state) => state.step)
  const setStep = useAssessmentStore((state) => state.setStep)
  const reset = useAssessmentStore((state) => state.reset)

  const handleLogoClick = () => {
    reset()
  }

  const handleCtaClick = () => {
    setStep("info")
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur-xl md:px-12">
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight text-primary transition-opacity hover:opacity-80"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          R
        </div>
        <span className="hidden sm:inline">RPA Community</span>
      </button>

      {step === "landing" && (
        <Button
          onClick={handleCtaClick}
          className="rounded-lg bg-primary px-5 py-2 font-[family-name:var(--font-display)] text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          Start Assessment
        </Button>
      )}

      {step !== "landing" && step !== "results" && (
        <div className="text-sm text-muted-foreground">
          {step === "info" && "Step 1: Company Info"}
          {step === "questions" && "Step 2: Assessment"}
          {step === "analyzing" && "Analyzing..."}
        </div>
      )}

      {step === "results" && (
        <Button
          onClick={reset}
          variant="outline"
          className="rounded-lg border-primary/30 font-[family-name:var(--font-display)] text-sm font-semibold text-primary hover:bg-primary/10"
        >
          New Assessment
        </Button>
      )}
    </nav>
  )
}
