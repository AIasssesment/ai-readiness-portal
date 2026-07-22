import { after, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { runCompanyEnrichment } from "@/lib/company-enrichment/service"
import { sql } from "@/lib/db"
import { isLikelyLinkedInUrl, normalizeLinkedInInput } from "@/lib/utils"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { linkedin?: unknown } | null
  const raw = typeof body?.linkedin === "string" ? body.linkedin : ""
  const linkedin = normalizeLinkedInInput(raw)

  if (!linkedin) {
    return NextResponse.json({ error: "LinkedIn URL is required" }, { status: 400 })
  }
  if (!isLikelyLinkedInUrl(linkedin)) {
    return NextResponse.json({ error: "Enter a valid LinkedIn URL" }, { status: 400 })
  }

  const updated = await sql<Array<{ id: string }>>`
    update clients
    set linkedin = ${linkedin}, updated_at = now()
    where user_id = ${user.id}
    returning id
  `
  if (!updated[0]) {
    return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
  }

  const clientId = updated[0].id
  // `after()` keeps the work alive after the response (serverless + next start).
  after(() => {
    void runCompanyEnrichment(clientId).catch((error) => {
      console.error("background company enrichment failed", error)
    })
  })

  return NextResponse.json({ ok: true, linkedin })
}
