'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useAssessmentStore } from '@/lib/assessment-store'
import type { CompanyInfo } from '@/lib/types'

export function CompanyInfoForm() {
  const setCompanyInfo = useAssessmentStore((state) => state.setCompanyInfo)
  const [formData, setFormData] = useState<CompanyInfo>({
    firstName: '',
    lastName: '',
    companyName: '',
    industry: '',
    employeeCount: '',
    email: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.companyName.trim()) {
      setError('Please fill in your name, email, and company before continuing.')
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
    <section className="px-6 py-20 border-t border-border bg-secondary" id="apply-section">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">
        Step 1 of 2
      </p>
      <h2 className="mb-3 text-center font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
        Apply to Start Your Assessment
      </h2>
      <p className="mx-auto mb-10 max-w-lg text-center text-muted-foreground">
        Tell us about yourself - your assessment unlocks immediately after submitting.
      </p>
      
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-background p-8 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                First Name *
              </label>
              <Input
                id="firstName"
                placeholder="Jane"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="h-12 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Last Name *
              </label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="h-12 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Work Email *
            </label>
            <Input
              id="email"
              type="email"
              placeholder="jane@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          
          <div>
            <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Company Name *
            </label>
            <Input
              id="companyName"
              placeholder="Acme Corp"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="h-12 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="mt-2 min-h-14 w-full rounded-xl bg-primary px-4 py-3 font-[family-name:var(--font-syne)] text-base font-bold leading-tight text-primary-foreground !whitespace-normal hover:bg-primary/90 sm:text-lg"
          >
            <span className="text-center break-words">Unlock My Free Assessment</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </div>
    </section>
  )
}
