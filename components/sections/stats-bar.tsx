import { STATS } from '@/lib/assessment-data'

export function StatsBar() {
  return (
    <div className="border-y border-border bg-card px-6 py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
        {STATS.map((stat, index) => (
          <div key={index}>
            <div className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-primary">
              {stat.value}
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
