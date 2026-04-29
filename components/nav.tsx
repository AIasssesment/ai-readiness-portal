'use client'

import { Button } from '@/components/ui/button'

interface NavProps {
  onStartAssessment: () => void
}

export function Nav({ onStartAssessment }: NavProps) {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur-xl md:px-12">
      <div className="font-[family-name:var(--font-syne)] text-xl font-extrabold tracking-tight text-primary">
        RPA Community
      </div>
      <Button 
        onClick={onStartAssessment}
        className="rounded-lg bg-primary px-5 py-2 font-[family-name:var(--font-syne)] text-sm font-bold text-primary-foreground hover:bg-primary/90"
      >
        Apply Now
      </Button>
    </nav>
  )
}
