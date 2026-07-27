"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EMPLOYEE_RANGES, INDUSTRIES } from "@/lib/assessment-data"
import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"
import { useLanguage } from "@/components/language-provider"

const UNSET = "__unset__"

export function AdminCompanyProfileControls({
  clientId,
  industry,
  companySize,
}: {
  clientId: string
  industry: string | null
  companySize: string | null
}) {
  const { t } = useLanguage()
  const [current, setCurrent] = useState({ industry, companySize })
  const [saving, setSaving] = useState(false)

  const save = async (patch: { industry?: string | null; company_size?: string | null }) => {
    const previous = current
    setCurrent((prev) => ({
      industry: "industry" in patch ? (patch.industry ?? null) : prev.industry,
      companySize: "company_size" in patch ? (patch.company_size ?? null) : prev.companySize,
    }))
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setCurrent(previous)
        toast.error(parseApiErrorMessage(data) ?? t("admin.saveFailed"))
        return
      }
      toast.success(t("admin.saved"))
    } catch {
      setCurrent(previous)
      toast.error(t("admin.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{t("admin.industry")}</label>
        <Select
          value={current.industry ?? UNSET}
          onValueChange={(value) => save({ industry: value === UNSET ? null : value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("admin.notSet")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>{t("admin.notSet")}</SelectItem>
            {INDUSTRIES.map((industryOption) => (
              <SelectItem key={industryOption} value={industryOption}>
                {industryOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{t("admin.companySize")}</label>
        <Select
          value={current.companySize ?? UNSET}
          onValueChange={(value) => save({ company_size: value === UNSET ? null : value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("admin.notSet")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>{t("admin.notSet")}</SelectItem>
            {EMPLOYEE_RANGES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {saving ? (
        <p className="col-span-full flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> {t("admin.saving")}
        </p>
      ) : null}
    </div>
  )
}
