import { createClient } from "@/lib/db-client/server"
import { PortalAssessmentFlow } from "@/components/portal/portal-assessment-flow"

type ClientRow = {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string
  industry: string | null
  company_size: string | null
}

export default async function NewPortalAssessmentPage() {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  const { data: client } = await db.from("clients").select().eq("user_id", user?.id).single()
  const typedClient = (client ?? null) as unknown as ClientRow | null

  return (
    <PortalAssessmentFlow
      clientId={typedClient?.id}
      companyName={typedClient?.company_name || ""}
      contactName={typedClient?.contact_name ?? null}
      contactEmail={typedClient?.contact_email || user?.email || ""}
      industry={typedClient?.industry}
      companySize={typedClient?.company_size}
    />
  )
}
