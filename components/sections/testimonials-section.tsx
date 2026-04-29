import { Star } from 'lucide-react'
import { TESTIMONIALS } from '@/lib/assessment-data'

export function TestimonialsSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">
          What Clients Say
        </p>
        <h2 className="mb-3 text-center font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
          Real Results from Real Teams
        </h2>
        <p className="mx-auto mb-14 max-w-lg text-center text-muted-foreground">
          Companies that went through our assessment and matched with Ukrainian RPA experts.
        </p>
        
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <div 
              key={index}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="flex gap-0.5 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="flex-1 text-sm italic leading-relaxed text-foreground/80">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 font-[family-name:var(--font-syne)] text-sm font-bold text-primary">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role} &bull; {testimonial.company}
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
