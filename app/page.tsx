'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useAssessmentStore } from '@/lib/assessment-store'
import { Nav } from '@/components/nav'
import { HeroSection } from '@/components/sections/hero-section'
import { StatsBar } from '@/components/sections/stats-bar'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { CaseStudiesSection } from '@/components/sections/case-studies-section'
import { CtaSection } from '@/components/sections/cta-section'
import { QuestionCard } from '@/components/assessment/question-card'
import { AnalyzingScreen } from '@/components/assessment/analyzing-screen'
import { ResultsPage } from '@/components/assessment/results-page'
import { useLanguage } from '@/components/language-provider'
import { tr } from '@/lib/i18n'

export default function HomePage() {
  const step = useAssessmentStore((state) => state.step)
  const setStep = useAssessmentStore((state) => state.setStep)
  const assessmentRef = useRef<HTMLDivElement>(null)
  const { locale } = useLanguage()

  const handleStartAssessment = useMemo(
    () => () => {
      setStep('info')
      requestAnimationFrame(() => {
        document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    [setStep],
  )

  useEffect(() => {
    if (step === 'questions' || step === 'analyzing' || step === 'results') {
      assessmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [step])

  return (
    <main className="min-h-screen bg-background">
      <Nav onStartAssessment={handleStartAssessment} />

      {(step === 'landing' || step === 'info') && (
        <div className="pt-20">
          <HeroSection />
          <StatsBar />
          <TestimonialsSection />
          <CaseStudiesSection />
          <CtaSection onStartAssessment={handleStartAssessment} />
        </div>
      )}

      {(step === 'questions' || step === 'analyzing' || step === 'results') && (
        <div ref={assessmentRef} className="min-h-screen pt-24">
          <div className="container mx-auto px-4 py-12 md:py-16">
            {step === 'questions' && (
              <div className="mx-auto max-w-2xl">
                <QuestionCard />
              </div>
            )}

            {step === 'analyzing' && (
              <div className="mx-auto max-w-lg">
                <AnalyzingScreen />
              </div>
            )}

            {step === 'results' && (
              <div className="mx-auto max-w-4xl">
                <ResultsPage />
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-[family-name:var(--font-syne)] text-sm font-bold text-primary-foreground">
                R
              </div>
              <span className="font-[family-name:var(--font-syne)] font-semibold text-foreground">
                RPA Community
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {tr(
                locale,
                'Connecting businesses with vetted Ukrainian RPA experts',
                "З'єднуємо бізнеси з перевіреними українськими RPA-експертами",
              )}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">
                {tr(locale, 'Privacy', 'Приватність')}
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                {tr(locale, 'Terms', 'Умови')}
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                {tr(locale, 'Contact', 'Контакти')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
