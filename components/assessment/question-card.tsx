'use client'

import { useEffect } from 'react'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAssessmentStore } from '@/lib/assessment-store'
import { ASSESSMENT_QUESTIONS } from '@/lib/assessment-data'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'
import type { TranslationKey } from '@/lib/i18n'

const AVG_SECONDS_PER_QUESTION = 12

function selectedOptionIndex(
  question: (typeof ASSESSMENT_QUESTIONS)[number],
  answer: { value: number; optionIndex?: number } | undefined,
): number | undefined {
  if (!answer) return undefined
  if (typeof answer.optionIndex === 'number' && answer.optionIndex >= 0) {
    return answer.optionIndex
  }
  const byValue = question.options.findIndex((o) => o.value === answer.value)
  return byValue >= 0 ? byValue : undefined
}

export function QuestionCard() {
  const { t } = useLanguage()
  const {
    currentQuestionIndex,
    answers,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    calculateResults,
  } = useAssessmentStore()

  const question = ASSESSMENT_QUESTIONS[currentQuestionIndex]
  const currentAnswer = answers.find((a) => a.questionId === question.id)
  const activeOptionIndex = selectedOptionIndex(question, currentAnswer)
  const progress = Math.round(((currentQuestionIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100)
  const isLastQuestion = currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1
  const remainingQuestions = ASSESSMENT_QUESTIONS.length - currentQuestionIndex - 1
  const remainingMin = Math.max(1, Math.ceil((remainingQuestions * AVG_SECONDS_PER_QUESTION) / 60))

  const handleNext = () => {
    if (!currentAnswer) return
    if (isLastQuestion) {
      calculateResults()
    } else {
      nextQuestion()
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      const keyNum = parseInt(e.key, 10)
      if (!Number.isNaN(keyNum) && keyNum >= 1 && keyNum <= question.options.length) {
        e.preventDefault()
        const idx = keyNum - 1
        const option = question.options[idx]
        if (option) answerQuestion(question.id, idx)
        return
      }

      if (e.key === 'ArrowLeft') {
        if (currentQuestionIndex > 0) {
          e.preventDefault()
          prevQuestion()
        }
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!currentAnswer) return
        e.preventDefault()
        const last = currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1
        if (last) {
          calculateResults()
        } else {
          nextQuestion()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    question.id,
    question.options,
    currentAnswer,
    activeOptionIndex,
    currentQuestionIndex,
    answerQuestion,
    prevQuestion,
    nextQuestion,
    calculateResults,
  ])

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 px-6 py-20 border-t border-border bg-secondary">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">
        {t('assessment.flow.step2Badge')}
      </p>
      <h2 className="mb-10 text-center font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t('assessment.flow.mainTitle')}
      </h2>

      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-8 md:p-12">
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {t('assessment.flow.questionProgress')
              .replace('{current}', String(currentQuestionIndex + 1))
              .replace('{total}', String(ASSESSMENT_QUESTIONS.length))}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3 w-3" />
            {remainingQuestions === 0
              ? t('assessment.flow.timeAlmostDone')
              : t('assessment.flow.timeMinutesLeft').replace('{minutes}', String(remainingMin))}
          </span>
        </div>

        <h3 className="mb-7 font-[family-name:var(--font-syne)] text-xl font-semibold leading-relaxed">
          {currentQuestionIndex + 1}. {t(`assessment.${question.id}.q` as TranslationKey)}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const selected = activeOptionIndex === index
            return (
              <button
                key={index}
                type="button"
                onClick={() => answerQuestion(question.id, index)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border-2 bg-secondary px-5 py-4 text-left text-[15px] transition-all',
                  selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground group-hover:border-primary/40',
                  )}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="flex-1">{t(`assessment.${question.id}.o${index + 1}` as TranslationKey)}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-11 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="h-12 gap-2 rounded-xl border-border px-8 hover:border-muted-foreground disabled:opacity-30 sm:order-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('assessment.flow.back')}
          </Button>
          <p className="order-3 hidden text-center text-xs text-muted-foreground sm:order-2 sm:block sm:flex-1">
            {t('assessment.flow.keyboardTip').replace('{max}', String(question.options.length))}
          </p>
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="h-12 gap-2 rounded-xl bg-primary px-12 font-[family-name:var(--font-syne)] font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 sm:order-3"
          >
            {isLastQuestion ? t('assessment.flow.seeResults') : t('assessment.flow.continue')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
