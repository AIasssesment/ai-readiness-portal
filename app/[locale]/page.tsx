'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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
import type { CompanyInfo, AssessmentAnswer, DimensionScores } from '@/lib/types'

export default function HomePage() {
  const step = useAssessmentStore((state) => state.step)
  const setStep = useAssessmentStore((state) => state.setStep)
  const purchaseExtendedReport = useAssessmentStore((state) => state.purchaseExtendedReport)
  const hydrateFromSavedAssessment = useAssessmentStore((state) => state.hydrateFromSavedAssessment)
  const assessmentRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const routeParams = useParams()
  const locale = routeParams.locale === 'uk' ? 'uk' : 'en'
  const [rehydrating, setRehydrating] = useState(false)
  const [rehydrateError, setRehydrateError] = useState<string | null>(null)
  const handledOpenResultsKey = useRef<string | null>(null)

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

  useEffect(() => {
    if (searchParams.get('openResults') !== '1') {
      handledOpenResultsKey.current = null
      return
    }

    const assessmentId = searchParams.get('assessmentId')
    const testPaid = searchParams.get('testPaid') === '1'
    const dedupeKey = `${assessmentId ?? ''}|${testPaid ? '1' : '0'}`
    if (handledOpenResultsKey.current === dedupeKey) return

    const run = async () => {
      if (!assessmentId) {
        handledOpenResultsKey.current = dedupeKey
        setStep('results')
        if (testPaid) purchaseExtendedReport()
        router.replace(`/${locale}`, { scroll: false })
        return
      }

      setRehydrating(true)
      setRehydrateError(null)

      try {
        const res = await fetch(`/api/assessments/${assessmentId}`)
        if (!res.ok) {
          handledOpenResultsKey.current = dedupeKey
          setRehydrateError(
            locale === 'uk'
              ? 'Не вдалося завантажити збережене оцінювання. Увійдіть або пройдіть тест знову.'
              : 'Could not load your saved assessment. Sign in or complete the assessment again.',
          )
          setRehydrating(false)
          return
        }

        const data = (await res.json()) as {
          assessment: {
            id: string
            clientId: string
            companyInfo: CompanyInfo
            answers: AssessmentAnswer[]
            overallScore: number
            dimensionScores: DimensionScores
            tier: 'high' | 'good' | 'early' | 'explore'
          }
        }

        const a = data.assessment
        hydrateFromSavedAssessment({
          companyInfo: a.companyInfo,
          answers: a.answers,
          overallScore: a.overallScore,
          dimensionScores: a.dimensionScores,
          tier: a.tier,
          savedAssessmentId: a.id,
          savedClientId: a.clientId,
        })
        if (testPaid) purchaseExtendedReport()
        handledOpenResultsKey.current = dedupeKey
        router.replace(`/${locale}`, { scroll: false })
      } catch {
        handledOpenResultsKey.current = dedupeKey
        setRehydrateError(
          locale === 'uk' ? 'Помилка завантаження оцінювання.' : 'Failed to load assessment.',
        )
      } finally {
        setRehydrating(false)
      }
    }

    void run()
  }, [hydrateFromSavedAssessment, locale, purchaseExtendedReport, router, searchParams, setStep])

  return (
    <main className="min-h-screen bg-background">
      {rehydrating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        </div>
      ) : null}

      {rehydrateError ? (
        <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          {rehydrateError}
        </div>
      ) : null}

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
              {t('landing.footer.tagline')}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground"> 
                {t('landing.footer.privacy')}
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                {t('landing.footer.terms')}
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                {t('landing.footer.contact')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
