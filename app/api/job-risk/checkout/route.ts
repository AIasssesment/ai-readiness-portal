import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"
import { backendErrorResponse } from "@/lib/api/backend-route"
import { resolveClientIdForUser } from "@/lib/api/resolve-client"
import { getSessionUser } from "@/lib/auth/session"

/** Price in minor units (cents) for the standalone Job Risk unlock. */
const JOB_RISK_PRICE_CENTS = 4900

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clientId = await resolveClientIdForUser(user.id)
    if (!clientId) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const origin = process.env.APP_URL || new URL(request.url).origin
    const returnUrlSuccess = `${origin}/portal/job-risk?paid=1`
    const returnUrlFail = `${origin}/portal/job-risk?paid=0`

    // Payments controller is not behind InternalApiGuard yet; still call via Nest.
    const payload = await backendFetch<{
      paymentId: string
      unlockId: string
      invoiceId: string
      pageUrl: string
      status: string
    }>("/payments/monobank/job-risk/invoices", {
      method: "POST",
      clientId,
      body: JSON.stringify({
        clientId,
        amount: JOB_RISK_PRICE_CENTS,
        currency: "USD",
        returnUrlSuccess,
        returnUrlFail,
      }),
    })

    return NextResponse.json({
      ok: true,
      paymentId: payload.paymentId,
      unlockId: payload.unlockId,
      invoiceId: payload.invoiceId,
      pageUrl: payload.pageUrl,
      status: payload.status,
    })
  } catch (error) {
    return backendErrorResponse(error, "Failed to start Job Risk checkout")
  }
}
