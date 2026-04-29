'use client'

import { useAssessmentStore } from '@/lib/assessment-store'
import { DIMENSION_NAMES } from '@/lib/assessment-data'

export function BasicResults() {
  const results = useAssessmentStore((state) => state.results)
  
  if (!results) return null

  const { 
    overallScore, 
    dimensionScores,
    tierLabel,
    advice,
  } = results

  const getTierEmoji = () => {
    if (overallScore >= 75) return '🟢'
    if (overallScore >= 60) return '🟡'
    if (overallScore >= 45) return '🟠'
    return '🔵'
  }

  return (
    <section className="animate-in fade-in px-6 py-20 bg-card">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
          Your Results
        </p>
        <h2 className="mb-8 font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
          RPA Readiness Score
        </h2>
        
        {/* Score Ring */}
        <div className="mx-auto mb-7 flex h-40 w-40 flex-col items-center justify-center rounded-full border-[6px] border-primary shadow-lg shadow-primary/20">
          <span className="font-[family-name:var(--font-syne)] text-6xl font-extrabold text-primary">
            {overallScore}
          </span>
          <span className="text-lg text-muted-foreground">/ 100</span>
        </div>
        
        {/* Tier */}
        <h3 className="mb-4 font-[family-name:var(--font-syne)] text-2xl font-bold">
          {getTierEmoji()} {tierLabel}
        </h3>
        
        {/* Advice */}
        <p className="mx-auto mb-12 max-w-lg text-muted-foreground">
          {advice}
        </p>
        
        {/* Dimension Scores Grid */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(dimensionScores)
            .filter(([key]) => key !== 'size')
            .map(([dimension, score]) => (
              <div 
                key={dimension}
                className="rounded-2xl border border-border bg-background p-5 text-center"
              >
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {DIMENSION_NAMES[dimension] || dimension}
                </p>
                <p className="font-[family-name:var(--font-syne)] text-3xl font-bold text-primary">
                  {score}%
                </p>
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}
