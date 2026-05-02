'use client'

import { Play } from 'lucide-react'
import { useState } from 'react'
import { CompanyInfoForm } from '@/components/assessment/company-info-form'
import { useLanguage } from '@/components/language-provider'

export function HeroSection() {
  const { t } = useLanguage()
  const [showVideo, setShowVideo] = useState(false)

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-10 md:pb-28 md:pt-14">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0,212,165,0.12) 0%, transparent 65%), radial-gradient(ellipse 45% 35% at 85% 75%, rgba(34,211,238,0.08) 0%, transparent 55%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-10 text-center md:mb-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {t('landing.hero.badge')}
          </div>

          <h1 className="mx-auto mb-5 max-w-4xl font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            <span className="text-balance">{t('landing.hero.title1')}</span>
            <br />
            <span className="text-primary">{t('landing.hero.title2')}</span>
          </h1>

          <p className="mx-auto max-w-xl text-lg font-light text-muted-foreground">
            {t('landing.hero.subtitle')}
          </p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/40">
              {!showVideo ? (
                <div
                  onClick={() => setShowVideo(true)}
                  className="group flex aspect-video cursor-pointer flex-col items-center justify-center gap-4 bg-secondary"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40 transition-transform group-hover:scale-110">
                    <Play className="ml-1 h-6 w-6 fill-primary-foreground text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.hero.videoHint')}</p>
                </div>
              ) : (
                <iframe
                  className="aspect-video w-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={t('landing.hero.videoTitle')}
                />
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
            <CompanyInfoForm embedded />
          </div>
        </div>
      </div>
    </section>
  )
}
