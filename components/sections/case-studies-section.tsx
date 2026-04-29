import { CASE_STUDIES } from '@/lib/assessment-data'

export function CaseStudiesSection() {
  return (
    <section className="bg-card px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">
          Case Studies
        </p>
        <h2 className="mb-3 text-center font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
          Automation That Delivered
        </h2>
        <p className="mx-auto mb-14 max-w-lg text-center text-muted-foreground">
          Real implementations by Ukrainian RPA teams matched through our platform.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CASE_STUDIES.map((study, index) => (
            <div 
              key={index}
              className="overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="border-b border-border px-6 py-5">
                <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  {study.industry}
                </span>
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold leading-snug">
                  {study.title}
                </h3>
              </div>
              <div className="px-6 py-5">
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {study.challenge}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {study.metrics.map((metric, i) => (
                    <div key={i} className="rounded-xl bg-secondary p-3.5 text-center">
                      <div className="font-[family-name:var(--font-syne)] text-xl font-extrabold text-primary">
                        {metric.value}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
