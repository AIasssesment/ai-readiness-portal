"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Check,
  CircleDashed,
  Globe,
  Loader2,
  Save,
  ScanSearch,
  Sparkles,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type StageKey = "loading" | "research" | "profile" | "generating" | "scoring" | "saving"
type StageStatus = "pending" | "active" | "done"

type StreamEvent =
  | { type: "stage"; stage: StageKey; status: "start" | "done"; message?: string }
  | { type: "profile"; summary: ProfileSummary }
  | { type: "done"; count: number }
  | { type: "error"; status: number; message: string }

type ProfileSummary = {
  industry: string | null
  business_model: string | null
  employee_count: string | number | null
  headquarters: string | null
  departments: string[]
  core_products_services: string[]
  tech_stack: string[]
  confirmed_pain_points: string[]
  recent_news: string[]
  sources_count: number
}

const STAGES: Array<{ key: StageKey; label: string; icon: typeof Globe }> = [
  { key: "loading", label: "Loading assessment & workforce", icon: CircleDashed },
  { key: "research", label: "Researching company on the web", icon: Globe },
  { key: "profile", label: "Building intelligence profile", icon: ScanSearch },
  { key: "generating", label: "Generating opportunities", icon: Sparkles },
  { key: "scoring", label: "Scoring & filtering (relevance ≥50)", icon: Target },
  { key: "saving", label: "Saving to database", icon: Save },
]

export function AdminGeneratePanel({
  clientId,
  disabled = false,
}: {
  clientId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [statuses, setStatuses] = useState<Record<StageKey, StageStatus>>(initialStatuses)
  const [messages, setMessages] = useState<Partial<Record<StageKey, string>>>({})
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [result, setResult] = useState<{ count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const applyEvent = (event: StreamEvent) => {
    if (event.type === "stage") {
      setStatuses((prev) => ({
        ...prev,
        [event.stage]: event.status === "start" ? "active" : "done",
      }))
      if (event.message) setMessages((prev) => ({ ...prev, [event.stage]: event.message }))
    } else if (event.type === "profile") {
      setProfile(event.summary)
    } else if (event.type === "done") {
      setResult({ count: event.count })
    } else if (event.type === "error") {
      setError(event.message)
    }
  }

  const handleGenerate = async () => {
    setIsRunning(true)
    setStatuses(initialStatuses())
    setMessages({})
    setProfile(null)
    setResult(null)
    setError(null)
    setElapsed(0)

    const startedAt = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250)

    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/opportunities/generate/stream`,
        { method: "POST" },
      )

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || `Request failed (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      // Read NDJSON: one JSON event per line.
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let newlineIndex: number
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)
          if (!line) continue
          try {
            applyEvent(JSON.parse(line) as StreamEvent)
          } catch {
            // Ignore malformed partial lines.
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRunning(false)
    }
  }

  // Auto-refresh the opportunities list once a run finishes successfully.
  useEffect(() => {
    if (result && !isRunning) {
      toast.success(`${result.count} opportunities generated`)
      router.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, isRunning])

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          AI opportunity generation
        </CardTitle>
        <CardDescription>
          Two-stage pipeline: web research → intelligence profile → scored opportunities. Replaces
          existing AI opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={handleGenerate} disabled={isRunning || disabled} className="h-11 gap-2">
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isRunning ? "Generating…" : result ? "Regenerate" : "Generate opportunities"}
          </Button>
          {(isRunning || result) && (
            <span className="text-sm tabular-nums text-muted-foreground">{elapsed}s</span>
          )}
        </div>

        {disabled && !isRunning ? (
          <p className="text-xs text-muted-foreground">
            No assessment yet — AI generation is unavailable until the company completes one.
          </p>
        ) : null}

        {(isRunning || result || error) && (
          <ol className="space-y-2 rounded-lg border bg-muted/30 p-3">
            {STAGES.map((stage) => {
              const status = statuses[stage.key]
              const Icon = stage.icon
              return (
                <li key={stage.key} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                    {status === "done" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : status === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={
                        status === "pending"
                          ? "text-muted-foreground/60"
                          : status === "done"
                            ? "text-foreground"
                            : "font-medium text-foreground"
                      }
                    >
                      {stage.label}
                    </span>
                    {messages[stage.key] ? (
                      <span className="block text-xs text-muted-foreground">{messages[stage.key]}</span>
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ol>
        )}

        {profile ? <ProfilePreview profile={profile} /> : null}

        {result ? (
          <SuccessBanner
            count={result.count}
            onReview={() =>
              document.getElementById("opportunities")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          />
        ) : null}

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SuccessBanner({ count, onReview }: { count: number; onReview: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Done — {count} drafts are ready for review.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onReview}>
        Review client previews
      </Button>
    </div>
  )
}

function ProfilePreview({ profile }: { profile: ProfileSummary }) {
  const facts: Array<{ label: string; value: string }> = []
  if (profile.industry) facts.push({ label: "Industry", value: profile.industry })
  if (profile.business_model) facts.push({ label: "Model", value: profile.business_model })
  if (profile.employee_count != null && profile.employee_count !== "")
    facts.push({ label: "Employees", value: String(profile.employee_count) })
  if (profile.headquarters) facts.push({ label: "HQ", value: profile.headquarters })

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <ScanSearch className="h-4 w-4 text-primary" />
        What the AI found
        <span className="text-xs font-normal text-muted-foreground">
          · {profile.sources_count} sources
        </span>
      </p>

      {facts.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {facts.map((f) => (
            <span key={f.label}>
              <span className="font-medium text-foreground">{f.value}</span> · {f.label}
            </span>
          ))}
        </div>
      ) : null}

      <ChipGroup title="Departments" items={profile.departments} />
      <ChipGroup title="Products / services" items={profile.core_products_services} />
      <ChipGroup title="Tech stack" items={profile.tech_stack} />
      <ChipGroup title="Pain points" items={profile.confirmed_pain_points} tone="warn" />
      {profile.recent_news.length ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Recent news</p>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
            {profile.recent_news.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ChipGroup({
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
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
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
    </div>
  )
}

function initialStatuses(): Record<StageKey, StageStatus> {
  return {
    loading: "pending",
    research: "pending",
    profile: "pending",
    generating: "pending",
    scoring: "pending",
    saving: "pending",
  }
}
