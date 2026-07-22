import { z } from "zod"

export const EnrichmentStatusSchema = z.enum(["pending", "ready", "failed", "skipped"])
export type EnrichmentStatus = z.infer<typeof EnrichmentStatusSchema>

export const DetectedJobSchema = z.object({
  job_title: z.string().min(1),
  location: z.string().nullable(),
  link: z.string().nullable(),
})

export const ImpliedRoleSchema = z.object({
  role_title: z.string().min(1),
  department: z.string().nullable(),
  signal_source: z.enum(["job_posting", "about", "people"]),
})

export const NormalizedCompanySchema = z.object({
  name: z.string().nullable(),
  about: z.string().nullable(),
  industry: z.string().nullable(),
  company_size: z.string().nullable(),
  headquarters: z.string().nullable(),
  open_job_count: z.number().nullable(),
  website: z.string().nullable(),
  exact_employee_count: z.number().nullable().optional(),
})

export const NormalizedEnrichmentSchema = z.object({
  company: NormalizedCompanySchema,
  detected_jobs: z.array(DetectedJobSchema).max(50),
  implied_roles: z.array(ImpliedRoleSchema).max(30),
})

export type DetectedJob = z.infer<typeof DetectedJobSchema>
export type ImpliedRole = z.infer<typeof ImpliedRoleSchema>
export type NormalizedCompany = z.infer<typeof NormalizedCompanySchema>
export type NormalizedEnrichment = z.infer<typeof NormalizedEnrichmentSchema>

/** Gemini output for department tagging of implied roles. */
export const ImpliedRolesBatchSchema = z.object({
  implied_roles: z.array(ImpliedRoleSchema).max(30),
})

export const EMPTY_NORMALIZED: NormalizedEnrichment = {
  company: {
    name: null,
    about: null,
    industry: null,
    company_size: null,
    headquarters: null,
    open_job_count: null,
    website: null,
    exact_employee_count: null,
  },
  detected_jobs: [],
  implied_roles: [],
}
