'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bot, Zap, BarChart3, Clock, Shield, TrendingUp, LogIn, LayoutDashboard } from 'lucide-react'
import { useAssessmentStore } from '@/lib/assessment-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CompanyInfoForm } from '@/components/assessment/company-info-form'
import { QuestionCard } from '@/components/assessment/question-card'
import { AnalyzingScreen } from '@/components/assessment/analyzing-screen'
import { ResultsPage } from '@/components/assessment/results-page'
import { useLanguage } from "@/components/language-provider"
import { tr } from "@/lib/i18n"

const BENEFITS = [
  {
    icon: Zap,
    titleEn: 'Instant Analysis',
    titleUk: 'Миттєвий аналіз',
    descriptionEn: 'AI-powered assessment in under 5 minutes',
    descriptionUk: 'Оцінювання на базі AI менш ніж за 5 хвилин',
  },
  {
    icon: BarChart3,
    titleEn: 'Data-Driven Insights',
    titleUk: 'Інсайти на основі даних',
    descriptionEn: 'Personalized recommendations based on your responses',
    descriptionUk: 'Персоналізовані рекомендації на основі ваших відповідей',
  },
  {
    icon: Clock,
    titleEn: 'Save Time & Money',
    titleUk: 'Економія часу та коштів',
    descriptionEn: 'Identify high-impact automation opportunities',
    descriptionUk: 'Визначайте можливості автоматизації з найбільшим ефектом',
  },
]

const TRUST_SIGNALS = [
  { icon: Shield, textEn: 'Secure & Private', textUk: 'Безпечно та приватно' },
  { icon: TrendingUp, textEn: '500+ Companies Assessed', textUk: '500+ компаній пройшли оцінювання' },
]

export default function HomePage() {
  const step = useAssessmentStore((state) => state.step)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const { locale } = useLanguage()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [supabase])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">AutomateIQ</span>
          </div>
          {!isCheckingAuth && (
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Link href="/portal">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {tr(locale, "My Portal", "Мій портал")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <LogIn className="h-4 w-4" />
                      {tr(locale, "Sign In", "Увійти")}
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm">{tr(locale, "Get Started", "Почати")}</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {step === 'info' && (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                {tr(locale, "Discover Your Automation Potential", "Відкрийте потенціал автоматизації")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                {tr(locale, "Get a free AI-powered analysis of your business operations and uncover opportunities to save time, reduce costs, and scale efficiently.", "Отримайте безкоштовний AI-аналіз ваших бізнес-процесів та знайдіть можливості, щоб заощаджувати час, зменшувати витрати і масштабуватися ефективніше.")}
              </p>
            </div>

            {/* Benefits */}
            <div className="grid gap-4 md:grid-cols-3 mb-10">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <div
                    key={benefit.titleEn}
                    className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{tr(locale, benefit.titleEn, benefit.titleUk)}</h3>
                      <p className="text-sm text-muted-foreground">{tr(locale, benefit.descriptionEn, benefit.descriptionUk)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Form */}
            <CompanyInfoForm />

            {/* Trust Signals */}
            <div className="flex items-center justify-center gap-6 mt-8">
              {TRUST_SIGNALS.map((signal) => {
                const Icon = signal.icon
                return (
                  <div key={signal.textEn} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{tr(locale, signal.textEn, signal.textUk)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 'questions' && (
          <div className="max-w-2xl mx-auto">
            <QuestionCard />
          </div>
        )}

        {step === 'analyzing' && (
          <div className="max-w-lg mx-auto">
            <AnalyzingScreen />
          </div>
        )}

        {step === 'results' && (
          <div className="max-w-4xl mx-auto">
            <ResultsPage />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">AutomateIQ</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {tr(locale, "Helping businesses unlock their automation potential since 2024", "Допомагаємо бізнесам розкривати потенціал автоматизації з 2024 року")}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">{tr(locale, "Privacy", "Приватність")}</a>
              <a href="#" className="hover:text-foreground transition-colors">{tr(locale, "Terms", "Умови")}</a>
              <a href="#" className="hover:text-foreground transition-colors">{tr(locale, "Contact", "Контакти")}</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
