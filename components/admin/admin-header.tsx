"use client"

import Link from "next/link"
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react"
import { LocaleToggle } from "@/components/locale-toggle"
import { useLanguage } from "@/components/language-provider"

export function AdminHeader({ email }: { email: string }) {
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{t("admin.title")}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <div className="mr-1 hidden sm:block">
            <LocaleToggle className="w-[140px]" />
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.companies")}</span>
          </Link>
          <Link
            href="/portal"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.backToPortal")}</span>
          </Link>
        </nav>
      </div>
      <div className="border-t px-4 py-2 sm:hidden md:px-8">
        <LocaleToggle />
      </div>
    </header>
  )
}
