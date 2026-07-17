import { Brain } from "lucide-react"

type Profile = Record<string, unknown>

function asStringList(value: unknown, max = 30): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item : item != null ? String(item) : ""))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max)
}

function asString(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s || null
}

/** Read-only view of the stored intelligence profile that feeds AI generation. */
export function AdminIntelligenceCard({
  profile,
  source,
  updatedAt,
}: {
  profile: Profile
  source: string
  updatedAt: string
}) {
  const facts: Array<{ label: string; value: string }> = []
  const industry = asString(profile.industry)
  const model = asString(profile.business_model)
  const employees = asString(profile.employee_count)
  const hq = asString(profile.headquarters)
  if (industry) facts.push({ label: "Industry", value: industry })
  if (model) facts.push({ label: "Model", value: model })
  if (employees) facts.push({ label: "Employees", value: employees })
  if (hq) facts.push({ label: "HQ", value: hq })

  const departments = asStringList(profile.departments)
  const products = asStringList(profile.core_products_services)
  const tech = asStringList(profile.tech_stack)
  const painPoints = asStringList(profile.confirmed_pain_points)
  const news = asStringList(profile.recent_news, 8)
  const sources = asStringList(profile.sources)
  const dataSources = asStringList(profile.likely_data_sources)

  const updated = new Date(updatedAt)
  const updatedLabel = Number.isNaN(updated.getTime())
    ? ""
    : updated.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })

  return (
    <details className="group rounded-xl border bg-card shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="flex min-w-0 items-center gap-2">
          <Brain className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm font-semibold">Stored AI company profile</span>
          <span className="truncate text-xs text-muted-foreground">
            {source} · {updatedLabel}
          </span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground group-open:hidden">Show</span>
        <span className="hidden shrink-0 text-xs text-muted-foreground group-open:inline">Hide</span>
      </summary>

      <div className="space-y-4 border-t p-4">
        {facts.length ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {facts.map((f) => (
              <span key={f.label}>
                <span className="font-medium text-foreground">{f.value}</span> · {f.label}
              </span>
            ))}
          </div>
        ) : null}

        <Chips title="Departments" items={departments} />
        <Chips title="Products / services" items={products} />
        <Chips title="Tech stack" items={tech} />
        <Chips title="Likely data sources" items={dataSources} />
        <Chips title="Confirmed pain points" items={painPoints} tone="warn" />

        {news.length ? (
          <Section title="Recent news">
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
              {news.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </Section>
        ) : null}

        {sources.length ? (
          <Section title={`Sources (${sources.length})`}>
            <ul className="space-y-0.5 text-xs">
              {sources.map((src, i) => {
                const href = /^https?:\/\//i.test(src) ? src : null
                return (
                  <li key={i} className="truncate">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {src}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">{src}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Section>
        ) : null}
      </div>
    </details>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function Chips({
  title,
  items,
  tone = "default",
}: {
  title: string
  items: string[]
  tone?: "default" | "warn"
}) {
  if (!items.length) return null
  return (
    <Section title={title}>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className={
              tone === "warn"
                ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300"
                : "rounded-full border bg-muted px-2 py-0.5 text-xs text-foreground"
            }
          >
            {item}
          </span>
        ))}
      </div>
    </Section>
  )
}
