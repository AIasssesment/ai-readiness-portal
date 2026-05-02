'use client'

import { Star } from 'lucide-react'
import { TESTIMONIALS } from '@/lib/assessment-data'
import { useLanguage } from '@/components/language-provider'
import type { TranslationKey } from '@/lib/i18n'

export function TestimonialsSection() {
  const { t } = useLanguage()

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">
          {t('landing.testimonials.overline')}
        </p>
        <h2 className="mb-3 text-center font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t('landing.testimonials.title')}
        </h2>
        <p className="mx-auto mb-14 max-w-lg text-center text-muted-foreground">
          {t('landing.testimonials.subtitle')}
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="flex gap-0.5 text-primary">
                {[...Array(5)].map((__, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="flex-1 text-sm italic leading-relaxed text-foreground/80">
                &ldquo;{t(`landing.testimonial.${index}.quote` as TranslationKey)}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 font-[family-name:var(--font-syne)] text-sm font-bold text-primary">
                  {TESTIMONIALS[index].initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {t(`landing.testimonial.${index}.author` as TranslationKey)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t(`landing.testimonial.${index}.role` as TranslationKey)} &bull;{' '}
                    {t(`landing.testimonial.${index}.company` as TranslationKey)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
