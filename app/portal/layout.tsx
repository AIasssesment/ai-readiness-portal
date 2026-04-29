import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PortalNav } from "@/components/portal/portal-nav"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get client info
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-muted/30">
      <PortalNav user={user} client={client} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
