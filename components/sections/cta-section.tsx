'use client'

import { Button } from '@/components/ui/button'

interface CtaSectionProps {
  onStartAssessment: () => void
}

export function CtaSection({ onStartAssessment }: CtaSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-border px-6 py-24 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 55%, rgba(45,212,191,0.14) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10">
        <h2 className="mx-auto mb-4 max-w-3xl font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Ready to Know Your RPA Readiness?
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-muted-foreground">
          Find out your score in 3 minutes. No fluff, no sales call — just real insight into whether automation can save you time and money.
        </p>
        <Button
          onClick={onStartAssessment}
          size="lg"
          className="h-auto rounded-xl border-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-12 py-5 font-[family-name:var(--font-syne)] text-lg font-bold text-zinc-950 shadow-[0_0_32px_-4px_rgba(45,212,191,0.6)] transition hover:brightness-105 hover:shadow-[0_0_44px_-2px_rgba(45,212,191,0.75)]"
        >
          Start Free Assessment
        </Button>
        <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">✓</span>
            16 quick questions
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">✓</span>
            Personalized score
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">✓</span>
            Matched experts
          </span>
        </div>
      </div>
    </section>
  )
}
