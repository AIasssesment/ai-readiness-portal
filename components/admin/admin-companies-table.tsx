"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Check, ExternalLink, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EMPLOYEE_RANGES, INDUSTRIES } from "@/lib/assessment-data"
import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"

export type AdminCompany = {
  id: string
  company_name: string
  website: string | null
  description: string | null
  industry: string | null
  company_size: string | null
  contact_name: string | null
  contact_email: string
  created_at: string
  account_email: string | null
  assessment_count: number
  opportunity_count: number
}

const UNSET = "__unset__"

export function AdminCompaniesTable({ companies }: { companies: AdminCompany[] }) {
  const [rows, setRows] = useState<AdminCompany[]>(companies)
  const [query, setQuery] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      row.company_name.toLowerCase().includes(q) ||
      (row.account_email ?? "").toLowerCase().includes(q) ||
      (row.contact_email ?? "").toLowerCase().includes(q) ||
      (row.industry ?? "").toLowerCase().includes(q)
    )
  })

  const save = async (
    id: string,
    patch: { industry?: string | null; company_size?: string | null },
  ) => {
    const previous = rows.find((r) => r.id === id)
    if (!previous) return

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setSavingId(id)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setRows((prev) => prev.map((r) => (r.id === id ? previous : r)))
        toast.error(parseApiErrorMessage(data) ?? "Failed to save")
        return
      }
      toast.success("Saved")
    } catch {
      setRows((prev) => prev.map((r) => (r.id === id ? previous : r)))
      toast.error("Failed to save")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company, email, industry…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No companies found.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const isSaving = savingId === row.id
            const needsAttention = !row.industry || !row.company_size
            return (
              <div
                key={row.id}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{row.company_name || "Unnamed"}</h3>
                      {needsAttention ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          Needs industry / size
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" /> Set
                        </span>
                      )}
                    </div>
                    {row.website ? (
                      <a
                        href={/^https?:\/\//i.test(row.website) ? row.website : `https://${row.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {row.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    {row.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{row.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {row.account_email || row.contact_email} · {row.assessment_count} assessments ·{" "}
                      {row.opportunity_count} opportunities
                    </p>
                    <Link
                      href={`/admin/companies/${row.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Manage opportunities
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:w-[420px]">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Industry</label>
                      <Select
                        value={row.industry ?? UNSET}
                        onValueChange={(value) =>
                          save(row.id, { industry: value === UNSET ? null : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Not set" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSET}>Not set</SelectItem>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Company size</label>
                      <Select
                        value={row.company_size ?? UNSET}
                        onValueChange={(value) =>
                          save(row.id, { company_size: value === UNSET ? null : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Not set" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSET}>Not set</SelectItem>
                          {EMPLOYEE_RANGES.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {isSaving ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
