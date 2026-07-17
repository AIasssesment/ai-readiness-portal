"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Eye, Loader2, Pencil, Send, Trash2, Undo2 } from "lucide-react"
import { OpportunityCard } from "@/components/portal/opportunity-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { COMPLEXITIES, PRIORITIES, STATUSES, TIMELINES } from "@/lib/opportunities/normalize"
import {
  computeAnnualSavingsUsd,
  computeWeeklyHoursSaved,
  formatCompactUsd,
  type OpportunityDetails,
  type SavingsAssumptions,
} from "@/lib/opportunities/savings"
import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"

export type AdminOpportunity = {
  id: string
  title: string
  description: string | null
  department: string | null
  priority: string
  complexity: string
  status: string
  source: string | null
  implementation_timeline: string | null
  estimated_annual_savings: string | number | null
  estimated_hours_saved_weekly: string | number | null
  notes: string | null
  pain_points: unknown
  decision_makers: unknown
  why_relevant: string | null
  relevance_score: number | null
  confidence_score: number | null
  savings_assumptions: SavingsAssumptions | Record<string, unknown> | null
  business_problem: string | null
  proposed_solution: string | null
  details: OpportunityDetails | Record<string, unknown> | null
  publication_status: "draft" | "published"
  published_at: string | null
  updated_at: string | null
}

type FormState = {
  title: string
  description: string
  department: string
  priority: string
  complexity: string
  status: string
  timeline: string
  businessProblem: string
  proposedSolution: string
  whyRelevant: string
  notes: string
  painPoints: string
  decisionMakers: string
  capabilities: string
  integrations: string
  evidence: string
  expectedRoi: string
  savingsConfidence: string
  relevanceScore: string
  confidenceScore: string
  annualSavings: string
  weeklyHours: string
  affectedHeadcount: string
  hoursPerPerson: string
  hourlyRate: string
  efficiencyPercent: string
}

export function AdminOpportunityList({
  clientId,
  opportunities,
}: {
  clientId: string
  opportunities: AdminOpportunity[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<AdminOpportunity | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [activeTab, setActiveTab] = useState("preview")
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  useEffect(() => {
    if (selected) setForm(toFormState(selected))
  }, [selected])

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  const request = async (
    opportunity: AdminOpportunity,
    body: Record<string, unknown>,
    action: string,
    success: string,
  ) => {
    setPendingAction(action)
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/opportunities/${opportunity.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        toast.error(parseApiErrorMessage(data) ?? "Failed to update opportunity")
        return false
      }
      toast.success(success)
      setSelected(null)
      router.refresh()
      return true
    } catch {
      toast.error("Failed to update opportunity")
      return false
    } finally {
      setPendingAction(null)
    }
  }

  const save = async (publish = false) => {
    if (!selected || !form) return
    if (form.title.trim().length < 3) {
      toast.error("Title must contain at least 3 characters")
      return
    }

    const assumptions = parseAssumptions(form)
    await request(
      selected,
      {
        title: form.title,
        description: form.description,
        department: form.department,
        priority: form.priority,
        complexity: form.complexity,
        status: form.status,
        timeline: form.timeline,
        business_problem: form.businessProblem,
        proposed_solution: form.proposedSolution,
        why_relevant: form.whyRelevant,
        notes: form.notes,
        pain_points: toList(form.painPoints),
        decision_makers: toList(form.decisionMakers),
        relevance_score: nullableNumber(form.relevanceScore),
        confidence_score: nullableNumber(form.confidenceScore),
        estimated_annual_savings: nullableNumber(form.annualSavings) ?? 0,
        estimated_hours_saved_weekly: nullableNumber(form.weeklyHours) ?? 0,
        ...(assumptions ? { savings_assumptions: assumptions } : {}),
        details: {
          expected_roi: form.expectedRoi,
          savings_confidence: form.savingsConfidence,
          capabilities: toList(form.capabilities),
          integrations: toList(form.integrations),
          evidence: toList(form.evidence),
        },
        ...(publish ? { publication_status: "published" } : {}),
      },
      publish ? "publish" : "save",
      publish ? "Published to the client" : "Changes saved",
    )
  }

  const unpublish = async (opportunity: AdminOpportunity) => {
    await request(
      opportunity,
      { publication_status: "draft" },
      "unpublish",
      "Returned to drafts and hidden from the client",
    )
  }

  const remove = async (opportunity: AdminOpportunity) => {
    setPendingAction("delete")
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/opportunities/${opportunity.id}`,
        { method: "DELETE" },
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        toast.error(parseApiErrorMessage(data) ?? "Failed to delete opportunity")
        return
      }
      toast.success("Opportunity deleted")
      setSelected(null)
      router.refresh()
    } catch {
      toast.error("Failed to delete opportunity")
    } finally {
      setPendingAction(null)
    }
  }

  if (opportunities.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No opportunities yet. Generate with AI or add one manually.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {opportunities.map((opportunity) => {
          const annual =
            parseFloat(String(opportunity.estimated_annual_savings ?? 0)) || 0
          const hours =
            parseFloat(String(opportunity.estimated_hours_saved_weekly ?? 0)) || 0
          const isPublished = opportunity.publication_status === "published"

          return (
            <div key={opportunity.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{opportunity.title}</h3>
                    <Badge
                      className={
                        isPublished
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }
                      variant="outline"
                    >
                      {isPublished ? "Published" : "Draft · needs review"}
                    </Badge>
                  </div>
                  {opportunity.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {opportunity.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{opportunity.priority}</Badge>
                    <Badge variant="outline">{opportunity.complexity}</Badge>
                    {opportunity.department ? (
                      <Badge variant="outline">{opportunity.department}</Badge>
                    ) : null}
                    <Badge variant="outline">{opportunity.status.replace(/_/g, " ")}</Badge>
                    {opportunity.source ? <Badge variant="outline">{opportunity.source}</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-emerald-600">
                      {formatCompactUsd(annual)}
                    </span>{" "}
                    / year · {hours.toLocaleString()} hrs / week
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setSelected(opportunity)
                      setActiveTab("preview")
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View / edit
                  </Button>
                  {!isPublished ? (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={pendingAction !== null}
                      onClick={() =>
                        request(
                          opportunity,
                          { publication_status: "published" },
                          `publish-${opportunity.id}`,
                          "Published to the client",
                        )
                      }
                    >
                      {pendingAction === `publish-${opportunity.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Publish
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <SheetContent className="w-full gap-0 p-0 sm:max-w-3xl">
          {selected && form ? (
            <>
              <SheetHeader className="border-b pr-12">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="line-clamp-1">{selected.title}</SheetTitle>
                  <Badge
                    variant="outline"
                    className={
                      selected.publication_status === "published"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }
                  >
                    {selected.publication_status}
                  </Badge>
                </div>
                <SheetDescription>
                  Preview the exact client card, edit any field, then publish when ready.
                </SheetDescription>
              </SheetHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="min-h-0 flex-1 gap-0"
              >
                <div className="border-b px-4 py-3">
                  <TabsList>
                    <TabsTrigger value="preview">
                      <Eye className="h-4 w-4" /> Client preview
                    </TabsTrigger>
                    <TabsTrigger value="edit">
                      <Pencil className="h-4 w-4" /> Edit
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="preview" className="min-h-0 flex-1">
                  <ScrollArea className="h-full">
                    <div className="bg-muted/30 p-4 sm:p-6">
                      <OpportunityCard opportunity={toPreviewOpportunity(selected, form)} />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="edit" className="min-h-0 flex-1">
                  <ScrollArea className="h-full">
                    <OpportunityEditForm form={form} update={update} />
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col gap-2 border-t bg-background p-4 sm:flex-row sm:items-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      disabled={pendingAction !== null}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this opportunity?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This cannot be undone. If published, it will immediately disappear from the
                        client portal.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => remove(selected)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
                  {selected.publication_status === "published" ? (
                    <Button
                      variant="outline"
                      className="gap-1.5"
                      disabled={pendingAction !== null}
                      onClick={() => unpublish(selected)}
                    >
                      <Undo2 className="h-4 w-4" /> Return to draft
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    disabled={pendingAction !== null}
                    onClick={() => save(false)}
                  >
                    {pendingAction === "save" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Save changes
                  </Button>
                  {selected.publication_status === "draft" ? (
                    <Button
                      className="gap-1.5"
                      disabled={pendingAction !== null}
                      onClick={() => save(true)}
                    >
                      {pendingAction === "publish" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Save & publish
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

function OpportunityEditForm({
  form,
  update,
}: {
  form: FormState
  update: (field: keyof FormState, value: string) => void
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <FormSection title="Core content">
        <Field label="Title">
          <Input value={form.title} onChange={(event) => update("title", event.target.value)} />
        </Field>
        <Field label="Summary">
          <Textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            className="min-h-24"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Department">
            <Input
              value={form.department}
              onChange={(event) => update("department", event.target.value)}
            />
          </Field>
          <Field label="Timeline">
            <Select value={form.timeline} onValueChange={(value) => update("timeline", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMELINES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(value) => update("priority", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Complexity">
            <Select value={form.complexity} onValueChange={(value) => update("complexity", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMPLEXITIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Lifecycle status">
            <Select value={form.status} onValueChange={(value) => update("status", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((value) => <SelectItem key={value} value={value}>{value.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Business case">
        <Field label="Business problem">
          <Textarea value={form.businessProblem} onChange={(event) => update("businessProblem", event.target.value)} />
        </Field>
        <Field label="Proposed solution">
          <Textarea value={form.proposedSolution} onChange={(event) => update("proposedSolution", event.target.value)} />
        </Field>
        <Field label="Why relevant">
          <Textarea value={form.whyRelevant} onChange={(event) => update("whyRelevant", event.target.value)} />
        </Field>
        <Field label="Expected ROI">
          <Input value={form.expectedRoi} onChange={(event) => update("expectedRoi", event.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Savings assumptions" description="When all four assumptions are set, totals are recalculated on save.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Affected headcount" value={form.affectedHeadcount} onChange={(value) => update("affectedHeadcount", value)} />
          <NumberField label="Hours / person / week" value={form.hoursPerPerson} onChange={(value) => update("hoursPerPerson", value)} step="0.1" />
          <NumberField label="Hourly rate (USD)" value={form.hourlyRate} onChange={(value) => update("hourlyRate", value)} step="0.1" />
          <NumberField label="Efficiency (%)" value={form.efficiencyPercent} onChange={(value) => update("efficiencyPercent", value)} step="1" />
          <NumberField label="Annual savings (USD)" value={form.annualSavings} onChange={(value) => update("annualSavings", value)} step="100" />
          <NumberField label="Hours saved / week" value={form.weeklyHours} onChange={(value) => update("weeklyHours", value)} step="0.1" />
        </div>
        <Field label="Savings confidence">
          <Input value={form.savingsConfidence} onChange={(event) => update("savingsConfidence", event.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Audience & evidence" description="Enter one item per line.">
        <Field label="Pain points">
          <Textarea value={form.painPoints} onChange={(event) => update("painPoints", event.target.value)} />
        </Field>
        <Field label="Decision makers">
          <Textarea value={form.decisionMakers} onChange={(event) => update("decisionMakers", event.target.value)} />
        </Field>
        <Field label="Required AI capabilities">
          <Textarea value={form.capabilities} onChange={(event) => update("capabilities", event.target.value)} />
        </Field>
        <Field label="Required integrations">
          <Textarea value={form.integrations} onChange={(event) => update("integrations", event.target.value)} />
        </Field>
        <Field label="Source evidence">
          <Textarea value={form.evidence} onChange={(event) => update("evidence", event.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Internal metadata">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Relevance score (0–100)" value={form.relevanceScore} onChange={(value) => update("relevanceScore", value)} />
          <NumberField label="Confidence score (0–100)" value={form.confidenceScore} onChange={(value) => update("confidenceScore", value)} />
        </div>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} />
        </Field>
      </FormSection>
    </div>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  step?: string
}) {
  return (
    <Field label={label}>
      <Input type="number" min="0" step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  )
}

function toPreviewOpportunity(
  opportunity: AdminOpportunity,
  form: FormState,
): AdminOpportunity {
  const assumptions = parseAssumptions(form)
  const annualSavings = assumptions
    ? computeAnnualSavingsUsd(assumptions)
    : nullableNumber(form.annualSavings) ?? 0
  const weeklyHours = assumptions
    ? computeWeeklyHoursSaved(assumptions)
    : nullableNumber(form.weeklyHours) ?? 0

  return {
    ...opportunity,
    title: form.title || "Untitled opportunity",
    description: form.description || null,
    department: form.department || null,
    priority: form.priority,
    complexity: form.complexity,
    status: form.status,
    implementation_timeline: form.timeline || null,
    business_problem: form.businessProblem || null,
    proposed_solution: form.proposedSolution || null,
    why_relevant: form.whyRelevant || null,
    notes: form.notes || null,
    pain_points: toList(form.painPoints),
    decision_makers: toList(form.decisionMakers),
    relevance_score: nullableNumber(form.relevanceScore),
    confidence_score: nullableNumber(form.confidenceScore),
    estimated_annual_savings: annualSavings,
    estimated_hours_saved_weekly: weeklyHours,
    savings_assumptions: assumptions ?? {},
    details: {
      expected_roi: form.expectedRoi,
      savings_confidence: form.savingsConfidence,
      capabilities: toList(form.capabilities),
      integrations: toList(form.integrations),
      evidence: toList(form.evidence),
    },
  }
}

function toFormState(opportunity: AdminOpportunity): FormState {
  const assumptions = parseExistingAssumptions(opportunity.savings_assumptions)
  const details = (opportunity.details ?? {}) as OpportunityDetails
  return {
    title: opportunity.title,
    description: opportunity.description ?? "",
    department: opportunity.department ?? "",
    priority: opportunity.priority,
    complexity: opportunity.complexity,
    status: opportunity.status,
    timeline: opportunity.implementation_timeline ?? "2-3 months",
    businessProblem: opportunity.business_problem ?? "",
    proposedSolution: opportunity.proposed_solution ?? "",
    whyRelevant: opportunity.why_relevant ?? "",
    notes: opportunity.notes ?? "",
    painPoints: toLines(opportunity.pain_points),
    decisionMakers: toLines(opportunity.decision_makers),
    capabilities: toLines(details.capabilities),
    integrations: toLines(details.integrations),
    evidence: toLines(details.evidence),
    expectedRoi: details.expected_roi ?? "",
    savingsConfidence: details.savings_confidence ?? "",
    relevanceScore: opportunity.relevance_score?.toString() ?? "",
    confidenceScore: opportunity.confidence_score?.toString() ?? "",
    annualSavings: String(opportunity.estimated_annual_savings ?? ""),
    weeklyHours: String(opportunity.estimated_hours_saved_weekly ?? ""),
    affectedHeadcount: assumptions?.affected_headcount.toString() ?? "",
    hoursPerPerson: assumptions?.hours_per_person_per_week.toString() ?? "",
    hourlyRate: assumptions?.blended_hourly_rate_usd.toString() ?? "",
    efficiencyPercent: assumptions ? String(assumptions.efficiency * 100) : "",
  }
}

function parseExistingAssumptions(value: unknown): SavingsAssumptions | null {
  if (!value || typeof value !== "object") return null
  const row = value as Partial<SavingsAssumptions>
  const parsed = {
    affected_headcount: Number(row.affected_headcount),
    hours_per_person_per_week: Number(row.hours_per_person_per_week),
    blended_hourly_rate_usd: Number(row.blended_hourly_rate_usd),
    efficiency: Number(row.efficiency),
  }
  return Object.values(parsed).every(Number.isFinite) ? parsed : null
}

function parseAssumptions(form: FormState): SavingsAssumptions | null {
  const values = [
    form.affectedHeadcount,
    form.hoursPerPerson,
    form.hourlyRate,
    form.efficiencyPercent,
  ]
  if (values.some((value) => value.trim() === "")) return null
  const numbers = values.map(Number)
  if (!numbers.every(Number.isFinite)) return null
  return {
    affected_headcount: numbers[0],
    hours_per_person_per_week: numbers[1],
    blended_hourly_rate_usd: numbers[2],
    efficiency: numbers[3] / 100,
  }
}

function toList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toLines(value: unknown): string {
  if (!Array.isArray(value)) return ""
  return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n")
}

function nullableNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
