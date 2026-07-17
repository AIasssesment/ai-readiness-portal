import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react"
import { requireAdmin } from "@/lib/auth/admin"
import { LanguageProvider } from "@/components/language-provider"
import { getServerLocale } from "@/lib/i18n-server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()
  if (!admin) {
    // Logged-in non-admins land back in the portal; middleware handles logged-out users.
    redirect("/portal")
  }

  const locale = await getServerLocale()

  return (
    <LanguageProvider initialLocale={locale}>
    <div className="min-h-screen overflow-x-hidden bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">Admin</p>
              <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Companies</span>
            </Link>
            <Link
              href="/portal"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to portal</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:py-8 md:px-8">
        {children}
      </main>
    </div>
    </LanguageProvider>
  )
}
