import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export function CtaSection() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <section className="relative overflow-hidden px-6 py-20">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,212,165,0.12) 0%, transparent 70%)'
          }}
        />
      </div>
      
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to Know Your RPA Readiness?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
          Find out your score in 3 minutes. No fluff, no sales call - just real 
          insight into whether automation can save you time and money.
        </p>
        
        <Button 
          onClick={scrollToTop}
          size="lg"
          className="mb-8 h-auto rounded-xl bg-primary px-12 py-5 font-[family-name:var(--font-display)] text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
        >
          Start Free Assessment
        </Button>
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            16 quick questions
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Personalized score
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Matched experts
          </div>
        </div>
      </div>
    </section>
  )
}
