"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"

const TIMELINES = ["1-2 weeks", "1 month", "2-3 months", "3-6 months", "6+ months"] as const

export function OpportunityAddForm({
  endpoint = "/api/opportunities",
}: {
  endpoint?: string
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [department, setDepartment] = useState("")
  const [priority, setPriority] = useState("medium")
  const [complexity, setComplexity] = useState("medium")
  const [timeline, setTimeline] = useState("2-3 months")
  const [headcount, setHeadcount] = useState("5")
  const [hoursPerWeek, setHoursPerWeek] = useState("4")
  const [rate, setRate] = useState("45")
  const [efficiency, setEfficiency] = useState("0.4")

  const reset = () => {
    setTitle("")
    setDescription("")
    setDepartment("")
    setPriority("medium")
    setComplexity("medium")
    setTimeline("2-3 months")
    setHeadcount("5")
    setHoursPerWeek("4")
    setRate("45")
    setEfficiency("0.4")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        department: department.trim() || undefined,
        priority,
        complexity,
        timeline,
        savings_assumptions: {
          affected_headcount: Number(headcount),
          hours_per_person_per_week: Number(hoursPerWeek),
          blended_hourly_rate_usd: Number(rate),
          efficiency: Number(efficiency),
        },
      }),
    })
    setLoading(false)

    if (!response.ok) {
      setError(t("opps.add.error"))
      return
    }

    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-lg">{t("opps.add.title")}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? t("opps.add.hide") : t("opps.add.show")}
        </Button>
      </CardHeader>
      {open && (
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="opp-title">{t("opps.add.fieldTitle")}</Label>
              <Input
                id="opp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="opp-desc">{t("opps.add.fieldDescription")}</Label>
              <Textarea
                id="opp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-dept">{t("opps.add.fieldDepartment")}</Label>
              <Input id="opp-dept" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-timeline">{t("opps.add.fieldTimeline")}</Label>
              <select
                id="opp-timeline"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              >
                {TIMELINES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-priority">{t("opps.add.fieldPriority")}</Label>
              <select
                id="opp-priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-complexity">{t("opps.add.fieldComplexity")}</Label>
              <select
                id="opp-complexity"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>

            <p className="md:col-span-2 text-xs text-muted-foreground">{t("opps.add.assumptionsHint")}</p>
            <div className="space-y-1.5">
              <Label htmlFor="opp-hc">{t("opps.add.fieldHeadcount")}</Label>
              <Input id="opp-hc" type="number" min={0} value={headcount} onChange={(e) => setHeadcount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-hours">{t("opps.add.fieldHours")}</Label>
              <Input
                id="opp-hours"
                type="number"
                min={0}
                step="0.5"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-rate">{t("opps.add.fieldRate")}</Label>
              <Input id="opp-rate" type="number" min={5} value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-eff">{t("opps.add.fieldEfficiency")}</Label>
              <Input
                id="opp-eff"
                type="number"
                min={0}
                max={1}
                step="0.05"
                value={efficiency}
                onChange={(e) => setEfficiency(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? t("common.saving") : t("opps.add.submit")}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
