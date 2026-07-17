'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn, normalizeCompanyWebsiteInput } from '@/lib/utils'
import { parseApiErrorMessage } from '@/lib/http/parse-api-error-message'
import { useAssessmentStore } from '@/lib/assessment-store'
import type { CompanyInfo } from '@/lib/types'
import { useLanguage } from '@/components/language-provider'

const neonCtaButtonClass =
  'w-full rounded-xl border-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-4 py-4 font-[family-name:var(--font-syne)] text-base font-bold !whitespace-normal leading-tight text-zinc-950 shadow-[0_0_28px_-4px_rgba(45,212,191,0.55)] transition hover:brightness-105 hover:shadow-[0_0_40px_-2px_rgba(45,212,191,0.7)] sm:text-lg'

function companyLabelFromWebsite(urlStr: string): string {
  try {
    const u = new URL(urlStr)
    return u.hostname.replace(/^www\./i, '') || urlStr.trim()
  } catch {
    return urlStr.trim()
  }
}

export function CompanyInfoForm({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const setCompanyInfo = useAssessmentStore((state) => state.setCompanyInfo)
  const [formData, setFormData] = useState<CompanyInfo>({
    firstName: '',
    lastName: '',
    companyName: '',
    website: '',
    description: '',
    email: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isProvisioning, setIsProvisioning] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const companyWebsite = normalizeCompanyWebsiteInput(formData.website || formData.companyName)
    const description = formData.description?.trim() || ''

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !companyWebsite ||
      !description
    ) {
      setError(t('companyForm.errorRequired'))
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('companyForm.errorEmail'))
      return
    }

    let urlOk = false
    try {
      urlOk = Boolean(new URL(companyWebsite))
    } catch {
      urlOk = false
    }
    if (!urlOk) {
      setError(t('companyForm.errorInvalidWebsite'))
      return
    }

    setError(null)
    setIsProvisioning(true)

    const displayName = companyLabelFromWebsite(companyWebsite)

    try {
      const res = await fetch('/api/assessment/provision-account', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          companyName: displayName,
          website: companyWebsite,
          description,
          locale,
        }),
      })

      const data = (await res.json()) as {
        ok?: boolean
        existingUser?: boolean
      }

      if (!res.ok) {
        setError(parseApiErrorMessage(data) ?? t('companyForm.provisionFailed'))
        return
      }

      if (data.existingUser) {
        router.push(`/${locale}/auth/login?email=${encodeURIComponent(formData.email.trim())}`)
        return
      }

      toast.success(t('companyForm.accountCreatedToast'))
      window.dispatchEvent(new Event('portal-auth-changed'))
      setCompanyInfo({
        ...formData,
        companyName: displayName,
        website: companyWebsite,
        description,
      })
    } catch {
      setError(t('companyForm.provisionFailed'))
    } finally {
      setIsProvisioning(false)
    }
  }

  const formCard = (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card/95 p-6 shadow-xl backdrop-blur-sm md:p-8',
        embedded && 'bg-background/90',
      )}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
        {t('assessment.flow.step1Badge')}
      </p>
      <h2
        className={cn(
          'mb-2 font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl',
          embedded && 'text-left',
          !embedded && 'text-center',
        )}
      >
        {t('companyForm.title')}
      </h2>
      <p
        className={cn(
          'mb-8 text-muted-foreground',
          embedded ? 'text-left text-sm sm:text-base' : 'mx-auto mb-10 max-w-lg text-center',
        )}
      >
        {t('companyForm.subtitle')}
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" autoComplete="on">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-muted-foreground">
              {t('companyForm.firstName')}
            </label>
            <Input
              id="firstName"
              placeholder={t('companyForm.phFirstName')}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="h-12 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-muted-foreground">
              {t('companyForm.lastName')}
            </label>
            <Input
              id="lastName"
              placeholder={t('companyForm.phLastName')}
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="h-12 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t('companyForm.email')}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t('companyForm.phEmail')}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-12 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="companyUrl" className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t('companyForm.website')}
          </label>
          <Input
            id="companyUrl"
            name="url"
            type="text"
            autoComplete="url"
            inputMode="url"
            placeholder={t('companyForm.phWebsite')}
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="h-12 border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t('companyForm.description')}
          </label>
          <Textarea
            id="description"
            rows={3}
            maxLength={500}
            placeholder={t('companyForm.phDescription')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t('companyForm.descriptionHint')}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isProvisioning} className={cn('mt-2 min-h-14', neonCtaButtonClass)}>
          {isProvisioning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 shrink-0 animate-spin" />
              <span className="text-center break-words">{t('companyForm.provisioning')}</span>
            </>
          ) : (
            <>
              <span className="text-center break-words">{t('companyForm.cta')}</span>
              <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
            </>
          )}
        </Button>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
            {t('companyForm.bullet1')}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
            {t('companyForm.bullet2')}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
            {t('companyForm.bullet3')}
          </div>
        </div>
      </form>
    </div>
  )

  if (embedded) {
    return (
      <div id="apply-section" className="w-full">
        {formCard}
      </div>
    )
  }

  return (
    <section className="border-t border-border bg-secondary px-6 py-20" id="apply-section">
      <div className="mx-auto max-w-xl">{formCard}</div>
    </section>
  )
}
