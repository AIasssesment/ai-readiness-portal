import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeCompanyWebsiteInput(raw: string): string {
  const s = raw.trim()
  if (!s) return ""
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

/**
 * Normalize a LinkedIn profile/company input into a full https URL.
 * Accepts full URLs, `linkedin.com/...`, or a bare handle like `company/acme`.
 */
export function normalizeLinkedInInput(raw: string): string {
  const s = raw.trim().replace(/^@/, "")
  if (!s) return ""
  if (/^https?:\/\//i.test(s)) return s
  if (/^(www\.)?linkedin\.com\//i.test(s)) return `https://${s.replace(/^www\./i, "")}`
  return `https://www.linkedin.com/${s.replace(/^\/+/, "")}`
}

/** Loose validation that a string points at a LinkedIn URL. */
export function isLikelyLinkedInUrl(value: string): boolean {
  return /^https?:\/\/([a-z0-9-]+\.)?linkedin\.com\/.+/i.test(value.trim())
}
