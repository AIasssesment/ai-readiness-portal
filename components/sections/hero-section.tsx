'use client'

import { Play, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useAssessmentStore } from '@/lib/assessment-store'
import type { CompanyInfo } from '@/lib/types'

export function HeroSection() {
  const [showVideo, setShowVideo] = useState(false)
  const setCompanyInfo = useAssessmentStore((state) => state.setCompanyInfo)
  const [formData, setFormData] = useState<CompanyInfo>({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.companyName.trim()) {
      setError('Please fill in all fields.')
      return
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.')
      return
    }
    
    setError(null)
    setCompanyInfo(formData)
  }

  return (
    <section className="relative min-h-screen overflow-hidden px-6 pb-20 pt-28">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(0,212,165,0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(34,211,238,0.07) 0%, transparent 60%)'
          }}
        />
      </div>
      
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Free Assessment &bull; 3 Minutes &bull; Instant Score
          </div>
        </div>
        
        {/* Headline */}
        <div className="mb-12 text-center">
          <h1 className="mb-5 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            <span className="text-balance">Know Your RPA Readiness.</span>
            <br />
            <span className="text-primary">Get Matched with Ukrainian Experts.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg font-light text-muted-foreground">
            Watch how Ukrainian RPA teams deliver world-class automation - then find out if you&apos;re ready to start.
          </p>
        </div>
        
        {/* Video + Form Grid */}
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Video */}
          <div className="overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/50">
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
          
          {/* Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
            <div className="mb-6">
              <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                Apply to Start Your Assessment
              </h2>
              <p className="text-sm text-muted-foreground">
                Tell us about yourself - your assessment unlocks immediately after submitting.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                    First Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="firstName"
                    placeholder="Jane"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="h-11 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                    Last Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="h-11 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Work Email <span className="text-primary">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Company Name <span className="text-primary">*</span>
                </label>
                <Input
                  id="companyName"
                  placeholder="Acme Corp"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="h-11 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="mt-2 h-12 w-full rounded-xl bg-primary font-[family-name:var(--font-display)] text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.01] hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
              >
                Unlock My Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
            
            {/* Trust indicators */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                No credit card
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                Instant score
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                Vetted experts
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
