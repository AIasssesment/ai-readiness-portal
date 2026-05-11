"use client"

import { useEffect, useRef } from "react"
import { useAssessmentStore } from "@/lib/assessment-store"
import { Nav } from "@/components/nav"
import { HeroSection } from "@/components/sections/hero-section"
import { StatsBar } from "@/components/sections/stats-bar"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { CaseStudiesSection } from "@/components/sections/case-studies-section"
import { CtaSection } from "@/components/sections/cta-section"
import { QuestionCard } from "@/components/assessment/question-card"
import { AnalyzingScreen } from "@/components/assessment/analyzing-screen"
import { ResultsPage } from "@/components/assessment/results-page"

export default function HomePage() {
  const step = useAssessmentStore((state) => state.step)
  const assessmentRef = useRef<HTMLDivElement>(null)

  // Auto-scroll when step changes to questions or beyond
  useEffect(() => {
    if (step === "questions" || step === "analyzing" || step === "results") {
      assessmentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [step])

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Landing Page Content - shown on landing (form is in hero) */}
      {(step === "landing" || step === "info") && (
        <>
          <HeroSection />
          <StatsBar />
          <TestimonialsSection />
          <CaseStudiesSection />
          <CtaSection />
        </>
      )}

      {/* Assessment Section - Questions, Analyzing, Results */}
      {(step === "questions" || step === "analyzing" || step === "results") && (
        <div ref={assessmentRef} className="min-h-screen pt-24">
          <div className="container mx-auto px-4 py-12 md:py-16">
            {step === "questions" && (
              <div className="mx-auto max-w-2xl">
                <QuestionCard />
              </div>
            )}

            {step === "analyzing" && (
              <div className="mx-auto max-w-lg">
                <AnalyzingScreen />
              </div>
            )}

            {step === "results" && (
              <div className="mx-auto max-w-4xl">
                <ResultsPage />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-[family-name:var(--font-display)] text-sm font-bold text-primary-foreground">
                R
              </div>
              <span className="font-[family-name:var(--font-display)] font-semibold">
                RPA Community
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Connecting businesses with vetted Ukrainian RPA experts
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
              <a href="#" className="transition-colors hover:text-foreground">Terms</a>
              <a href="#" className="transition-colors hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
