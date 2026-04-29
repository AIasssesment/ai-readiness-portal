'use client'

import { Play, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface HeroSectionProps {
  onStartAssessment: () => void
}

export function HeroSection({ onStartAssessment }: HeroSectionProps) {
  const [showVideo, setShowVideo] = useState(false)

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 text-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(0,212,165,0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(34,211,238,0.07) 0%, transparent 60%)'
          }}
        />
      </div>
      
      {/* Badge */}
      <div className="relative z-10 mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Free Assessment &bull; 3 Minutes &bull; Instant Score
      </div>
      
      {/* Headline */}
      <h1 className="relative z-10 mb-5 max-w-4xl font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        <span className="text-balance">Know Your RPA Readiness.</span>
        <br />
        <span className="text-primary">Get Matched with Ukrainian Experts.</span>
      </h1>
      
      {/* Subheadline */}
      <p className="relative z-10 mx-auto mb-12 max-w-xl text-lg font-light text-muted-foreground">
        Watch how Ukrainian RPA teams deliver world-class automation - then find out if you&apos;re ready to start.
      </p>
      
      {/* Video */}
      <div className="relative z-10 mb-14 w-full max-w-3xl overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/50">
        {!showVideo ? (
          <div 
            onClick={() => setShowVideo(true)}
            className="group flex aspect-video cursor-pointer flex-col items-center justify-center gap-4 bg-secondary"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40 transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6 fill-primary-foreground text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Watch: How Ukrainian RPA Teams Work</p>
          </div>
        ) : (
          <iframe
            className="aspect-video w-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      
      {/* CTA Button */}
      <Button 
        onClick={onStartAssessment}
        size="lg"
        className="relative z-10 mb-8 h-auto rounded-xl bg-primary px-14 py-5 font-[family-name:var(--font-syne)] text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
      >
        Start Free Assessment
      </Button>
      
      {/* Trust indicators */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          No credit card
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          Instant personalized score
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          Vetted Ukrainian RPA experts
        </div>
      </div>
    </section>
  )
}
