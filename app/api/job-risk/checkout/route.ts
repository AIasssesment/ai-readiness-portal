import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"

/** Price in cents for the standalone Job Risk report unlock. */
const JOB_RISK_PRICE_CENTS = 4900

/**
 * Job Risk is a separate paid product. The real Monobank invoice + webhook live in
 * the external ai-portal-backend and are not part of this repo, so this route is a
 * placeholder that marks the unlock as paid. It is disabled in production unless
 * JOB_RISK_PAYMENT_STUB=1, to avoid granting free access before the real flow lands.
 */
export async function POST() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const stubAllowed = process.env.NODE_ENV !== "production" || process.env.JOB_RISK_PAYMENT_STUB === "1"
  if (!stubAllowed) {
    return NextResponse.json(
      { error: "Job Risk payment is not available yet. Please contact support." },
      { status: 501 },
    )
  }

  const clients = await sql<Array<{ id: string; linkedin: string | null }>>`
    select id, linkedin from clients where user_id = ${user.id} limit 1
  `
  const client = clients[0]
  if (!client) return NextResponse.json({ error: "Client profile not found" }, { status: 404 })

  if (!client.linkedin?.trim()) {
    return NextResponse.json({ error: "Add your LinkedIn URL before unlocking" }, { status: 400 })
  }

  await sql`
    insert into job_risk_unlocks (client_id, status, amount, currency, provider, updated_at)
    values (${client.id}, 'paid', ${JOB_RISK_PRICE_CENTS}, 'USD', 'stub', now())
    on conflict (client_id)
    do update set
      status = 'paid',
      amount = excluded.amount,
      currency = excluded.currency,
      provider = excluded.provider,
      updated_at = now()
  `

  return NextResponse.json({ ok: true })
}
