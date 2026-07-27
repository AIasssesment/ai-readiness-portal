import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth/admin"
import { LanguageProvider } from "@/components/language-provider"
import { AdminHeader } from "@/components/admin/admin-header"
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
        <AdminHeader email={admin.email} />
        <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:py-8 md:px-8">{children}</main>
      </div>
    </LanguageProvider>
  )
}
