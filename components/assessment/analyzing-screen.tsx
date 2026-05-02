'use client'

import { useEffect, useState } from 'react'
import { Brain, Zap, BarChart3, FileSearch, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'
import type { TranslationKey } from '@/lib/i18n'

const ANALYSIS_STEPS = [
  { icon: FileSearch, labelKey: 'analyzing.step0' as const },
  { icon: Brain, labelKey: 'analyzing.step1' as const },
  { icon: BarChart3, labelKey: 'analyzing.step2' as const },
  { icon: Zap, labelKey: 'analyzing.step3' as const },
  { icon: Target, labelKey: 'analyzing.step4' as const },
]

export function AnalyzingScreen() {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 100))
    }, 30)

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 600)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stepInterval)
    }
  }, [])

  return (
    <section className="animate-in fade-in px-6 py-20 bg-secondary">
      <div className="mx-auto max-w-lg">
        <div className="flex flex-col items-center text-center">
          {/* Animated brain icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-background shadow-lg shadow-primary/20">
              <Brain className="h-12 w-12 animate-pulse text-primary" />
            </div>
          </div>

          <h2 className="mb-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-foreground">
            {t('analyzing.title')}
          </h2>
          <p className="mb-8 text-muted-foreground">
            {t('analyzing.subtitle')}
          </p>

          {/* Progress bar */}
          <div className="mb-8 w-full">
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('analyzing.progress').replace('{pct}', String(progress))}
            </p>
          </div>

          {/* Analysis steps */}
          <div className="w-full space-y-3">
            {ANALYSIS_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isComplete = index < currentStep

              return (
                <div
                  key={step.labelKey}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all duration-300',
                    isActive && 'border-primary/30 bg-primary/10',
                    isComplete && 'opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                      isActive && 'bg-primary text-primary-foreground',
                      isComplete && 'bg-accent text-accent-foreground',
                      !isActive && !isComplete && 'bg-secondary text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isActive && 'text-primary',
                      isComplete && 'text-muted-foreground',
                      !isActive && !isComplete && 'text-muted-foreground/60'
                    )}
                  >
                    {t(step.labelKey as TranslationKey)}
                  </span>
                  {isActive && (
                    <div className="ml-auto flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
