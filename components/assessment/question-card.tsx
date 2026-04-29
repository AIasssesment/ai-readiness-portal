'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAssessmentStore } from '@/lib/assessment-store'
import { ASSESSMENT_QUESTIONS } from '@/lib/assessment-data'
import { cn } from '@/lib/utils'

export function QuestionCard() {
  const { 
    currentQuestionIndex, 
    answers, 
    answerQuestion, 
    nextQuestion, 
    prevQuestion,
    calculateResults 
  } = useAssessmentStore()
  
  const question = ASSESSMENT_QUESTIONS[currentQuestionIndex]
  const currentAnswer = answers.find((a) => a.questionId === question.id)
  const progress = Math.round((currentQuestionIndex / ASSESSMENT_QUESTIONS.length) * 100)
  const isLastQuestion = currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1
  
  const handleOptionSelect = (e: React.MouseEvent, value: number) => {
    e.preventDefault()
    e.stopPropagation()
    answerQuestion(question.id, value)
  }
  
  const handleNext = () => {
    if (isLastQuestion) {
      calculateResults()
    } else {
      nextQuestion()
    }
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 px-6 py-20 border-t border-border bg-secondary">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">
        Step 2 of 2 - Assessment
      </p>
      <h2 className="mb-10 text-center font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
        RPA Readiness Assessment
      </h2>
      
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-8 md:p-12">
        {/* Progress bar */}
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mb-10 text-center text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {ASSESSMENT_QUESTIONS.length}
        </p>
        
        {/* Question */}
        <h3 className="mb-7 font-[family-name:var(--font-syne)] text-xl font-semibold leading-relaxed">
          {currentQuestionIndex + 1}. {question.question}
        </h3>
        
        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => handleOptionSelect(e, option.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border-2 bg-secondary px-5 py-4 text-left text-[15px] transition-all",
                currentAnswer?.value === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span 
                className={cn(
                  "h-[18px] w-[18px] shrink-0 rounded-full border-2 transition-colors",
                  currentAnswer?.value === option.value
                    ? "border-primary bg-primary"
                    : "border-border"
                )}
              />
              {option.label}
            </button>
          ))}
        </div>
        
        {/* Navigation */}
        <div className="mt-11 flex items-center justify-center gap-4">
          {currentQuestionIndex > 0 && (
            <Button
              variant="outline"
              onClick={prevQuestion}
              className="h-12 gap-2 rounded-xl border-border px-8 hover:border-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
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
