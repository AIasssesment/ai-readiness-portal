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
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAssessmentStore } from '@/lib/assessment-store'

const EXTENDED_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Readiness Score',
    description: 'Technical, organizational, and process maturity breakdown',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Index',
    description: 'Risk assessment with severity levels and mitigation strategies',
  },
  {
    icon: Target,
    title: 'Top 5 Automation Opportunities',
    description: 'Prioritized list with ROI estimates and implementation timelines',
  },
  {
    icon: BarChart3,
    title: 'Cost-Benefit Analysis',
    description: 'Projected savings, implementation costs, and 5-year ROI',
  },
  {
    icon: Layers,
    title: 'Recommended Tech Stack',
    description: 'Curated tools and platforms tailored to your needs',
  },
  {
    icon: Calendar,
    title: '90-Day Action Plan',
    description: 'Step-by-step roadmap with milestones',
  },
  {
    icon: FileBarChart,
    title: 'Industry Benchmarks',
    description: 'Compare to industry averages and top performers',
  },
  {
    icon: AlertTriangle,
    title: 'AI Disruption Risk',
    description: 'Roles at risk and workforce transition recommendations',
  },
  {
    icon: Map,
    title: 'Implementation Roadmap',
    description: 'Quarterly plan with initiatives and dependencies',
  },
  {
    icon: FileText,
    title: 'Executive Summary',
    description: 'Key findings and strategic recommendations',
  },
]

export function ExtendedReportUpsell() {
  const [showCheckout, setShowCheckout] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const purchaseExtendedReport = useAssessmentStore((state) => state.purchaseExtendedReport)
  const results = useAssessmentStore((state) => state.results)

  const handlePurchase = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    purchaseExtendedReport()
    setShowCheckout(false)
    setIsProcessing(false)
  }

  return (
    <>
      <div className="bg-secondary px-6 py-16">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-primary/30 bg-background">
            <div className="flex items-center justify-between bg-primary px-6 py-3">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Lock className="h-4 w-4" />
                <span className="font-[family-name:var(--font-display)] font-bold">Extended Report</span>
              </div>
              <span className="rounded-full bg-primary-foreground px-3 py-1 text-sm font-bold text-primary">
                $29 One-Time
              </span>
            </div>
            
            <div className="p-6 sm:p-8">
              <h3 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                Unlock Your Complete Automation Blueprint
              </h3>
              <p className="mb-8 text-muted-foreground">
                Get actionable insights, detailed roadmaps, and expert recommendations tailored to {results?.companyInfo.companyName || 'your company'}
              </p>

              {/* Features Grid */}
              <div className="mb-8 grid gap-3 sm:grid-cols-2">
                {EXTENDED_FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div 
                      key={feature.title} 
                      className="flex items-start gap-3 rounded-xl bg-secondary p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Value Props */}
              <div className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-y border-border py-4">
                {[
                  'Instant PDF download',
                  'Implementation guides',
                  'ROI calculator included',
                  'Lifetime access',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="h-14 w-full rounded-xl bg-primary px-12 font-[family-name:var(--font-display)] text-lg font-bold text-primary-foreground hover:bg-primary/90 sm:w-auto"
                  onClick={() => setShowCheckout(true)}
                >
                  Get Extended Report - $29
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Secure payment. Instant delivery. 30-day money-back guarantee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Get instant access to your Extended Automation Report
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Order Summary */}
            <div className="space-y-3 rounded-xl bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Extended Report</span>
                <span className="font-semibold">$29.00</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>For: {results?.companyInfo.companyName}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">$29.00</span>
              </div>
            </div>

            {/* Demo Notice */}
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-center text-sm text-muted-foreground">
                <strong className="text-foreground">Demo Mode:</strong> This is a prototype. Click below to simulate a successful purchase and view the extended report.
              </p>
            </div>

            {/* Purchase Button */}
            <Button 
              className="h-12 w-full rounded-xl bg-primary font-[family-name:var(--font-display)] text-base font-bold text-primary-foreground hover:bg-primary/90"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Purchase
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By purchasing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
