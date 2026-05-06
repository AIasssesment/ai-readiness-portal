'use client'

import { useEffect } from 'react'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAssessmentStore } from '@/lib/assessment-store'
import { ASSESSMENT_QUESTIONS } from '@/lib/assessment-data'
import { cn } from '@/lib/utils'

const AVG_SECONDS_PER_QUESTION = 12

export function QuestionCard() {
  const {
    currentQuestionIndex,
    answers,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    calculateResults,
  } = useAssessmentStore()

  const question = ASSESSMENT_QUESTIONS[currentQuestionIndex]
  const currentAnswer = answers.find((a) => a.questionId === question.id)
  const progress = Math.round(((currentQuestionIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100)
  const isLastQuestion = currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1
  const remainingQuestions = ASSESSMENT_QUESTIONS.length - currentQuestionIndex - 1
  const remainingMin = Math.max(1, Math.ceil((remainingQuestions * AVG_SECONDS_PER_QUESTION) / 60))

  const handleOptionSelect = (optionIndex: number, value: number) => {
    answerQuestion(question.id, value, optionIndex)
  }

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
        answerQuestion(question.id, option.value, idx)
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
        if (currentAnswer) {
          e.preventDefault()
          handleNext()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, question.options, currentAnswer?.value, currentQuestionIndex])

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 px-6 py-20 border-t border-border bg-secondary">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">
        Step 2 of 2 - Assessment
      </p>
      <h2 className="mb-10 text-center font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
        RPA Readiness Assessment
      </h2>

      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-8 md:p-12">
        {/* Sticky-feeling progress bar with time estimate */}
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mb-10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {currentQuestionIndex + 1} of {ASSESSMENT_QUESTIONS.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {remainingQuestions === 0 ? 'Almost done' : `~${remainingMin} min left`}
          </span>
        </div>

        <h3 className="mb-7 font-[family-name:var(--font-syne)] text-xl font-semibold leading-relaxed">
          {currentQuestionIndex + 1}. {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const selected =
              typeof currentAnswer?.optionIndex === 'number'
                ? currentAnswer.optionIndex === index
                : currentAnswer?.value === option.value &&
                  question.options.findIndex((o) => o.value === currentAnswer.value) === index
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionSelect(index, option.value)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border-2 bg-secondary px-5 py-4 text-left text-[15px] transition-all',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground group-hover:border-primary/40'
                  )}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="flex-1">{option.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-11 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="h-12 gap-2 rounded-xl border-border px-8 hover:border-muted-foreground disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Tip: press <kbd className="rounded border border-border bg-background px-1.5 py-0.5">1</kbd>–
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5">
              {question.options.length}
            </kbd>{' '}
            to answer, <kbd className="rounded border border-border bg-background px-1.5 py-0.5">↵</kbd>{' '}
            to continue
          </p>
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="h-12 gap-2 rounded-xl bg-primary px-12 font-[family-name:var(--font-syne)] font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {isLastQuestion ? 'See Results' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
