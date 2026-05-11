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
