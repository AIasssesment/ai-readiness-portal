'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, Zap, BarChart3, Clock, Shield, TrendingUp, LogIn, LayoutDashboard } from 'lucide-react'
import { useAssessmentStore } from '@/lib/assessment-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CompanyInfoForm } from '@/components/assessment/company-info-form'
import { QuestionCard } from '@/components/assessment/question-card'
import { AnalyzingScreen } from '@/components/assessment/analyzing-screen'
import { ResultsPage } from '@/components/assessment/results-page'

const BENEFITS = [
  {
    icon: Zap,
    title: 'Instant Analysis',
    description: 'AI-powered assessment in under 5 minutes',
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Insights',
    description: 'Personalized recommendations based on your responses',
  },
  {
    icon: Clock,
    title: 'Save Time & Money',
    description: 'Identify high-impact automation opportunities',
  },
]

const TRUST_SIGNALS = [
  { icon: Shield, text: 'Secure & Private' },
  { icon: TrendingUp, text: '500+ Companies Assessed' },
]

export default function HomePage() {
  const step = useAssessmentStore((state) => state.step)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [supabase.auth])

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
                    My Portal
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm">Get Started</Button>
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
                Discover Your Automation Potential
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Get a free AI-powered analysis of your business operations and uncover opportunities 
                to save time, reduce costs, and scale efficiently.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid gap-4 md:grid-cols-3 mb-10">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <div
                    key={benefit.title}
                    className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
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
                  <div key={signal.text} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{signal.text}</span>
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
              Helping businesses unlock their automation potential since 2024
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
