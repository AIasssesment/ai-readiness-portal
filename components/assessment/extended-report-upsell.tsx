'use client'

import { useState } from 'react'
import {
  Lock,
  CheckCircle2,
  FileText,
  TrendingUp,
  Target,
  Layers,
  Calendar,
  BarChart3,
  AlertTriangle,
  Map,
  FileBarChart,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAssessmentStore } from '@/lib/assessment-store'
import { useLanguage } from '@/components/language-provider'
import type { TranslationKey } from '@/lib/i18n'

const FEATURE_ICONS = [
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  Layers,
  Calendar,
  FileBarChart,
  AlertTriangle,
  Map,
  FileText,
]

export function ExtendedReportUpsell() {
  const { t } = useLanguage()
  const [showCheckout, setShowCheckout] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const purchaseExtendedReport = useAssessmentStore((state) => state.purchaseExtendedReport)
  const results = useAssessmentStore((state) => state.results)

  const companyName = results?.companyInfo.companyName?.trim()
  const subline = t('extendedUpsell.subline').replace(
    '{company}',
    companyName || t('extendedUpsell.companyFallback'),
  )

  const handlePurchase = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    purchaseExtendedReport()
    setShowCheckout(false)
    setIsProcessing(false)
  }

  return (
    <>
      <div className="bg-secondary px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 overflow-hidden rounded-2xl border border-primary/30 bg-background">
            <div className="flex items-center justify-between bg-primary px-6 py-3">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Lock className="h-4 w-4" />
                <span className="font-[family-name:var(--font-syne)] font-bold">{t('extendedUpsell.badge')}</span>
              </div>
              <span className="rounded-full bg-primary-foreground px-3 py-1 text-sm font-bold text-primary">
                {t('extendedUpsell.price')}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              <h3 className="mb-2 font-[family-name:var(--font-syne)] text-2xl font-bold">{t('extendedUpsell.headline')}</h3>
              <p className="mb-8 text-muted-foreground">{subline}</p>

              <div className="mb-8 grid gap-3 sm:grid-cols-2">
                {FEATURE_ICONS.map((Icon, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t(`extendedUpsell.f${i}.title` as TranslationKey)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`extendedUpsell.f${i}.desc` as TranslationKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-y border-border py-4">
                {(['extendedUpsell.value1', 'extendedUpsell.value2', 'extendedUpsell.value3', 'extendedUpsell.value4'] as const).map((key) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{t(key)}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-xl bg-primary px-12 font-[family-name:var(--font-syne)] text-lg font-bold text-primary-foreground hover:bg-primary/90 sm:w-auto"
                  onClick={() => setShowCheckout(true)}
                >
                  {t('extendedUpsell.cta')}
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">{t('extendedUpsell.secureNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-syne)] text-xl">{t('unlock.purchaseTitle')}</DialogTitle>
            <DialogDescription>{t('unlock.purchaseDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3 rounded-xl bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t('unlock.extendedReport')}</span>
                <span className="font-semibold">$29.00</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {t('extendedUpsell.orderFor')} {results?.companyInfo.companyName}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">{t('unlock.total')}</span>
                <span className="text-lg font-bold text-primary">$29.00</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-center text-sm text-muted-foreground">
                <strong className="text-foreground">{t('unlock.demoMode')}</strong> {t('extendedUpsell.demoBody')}
              </p>
            </div>

            <Button
              className="h-12 w-full rounded-xl bg-primary font-[family-name:var(--font-syne)] text-base font-bold text-primary-foreground hover:bg-primary/90"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {t('unlock.processing')}
                </>
              ) : (
                <>
                  {t('unlock.completePurchase')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">{t('extendedUpsell.legalFooter')}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
