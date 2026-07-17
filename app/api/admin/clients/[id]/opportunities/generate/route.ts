import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin"
import { apiErrors } from "@/lib/http/api-errors"
import {
  OpportunityServiceError,
  generateOpportunitiesForClient,
} from "@/lib/opportunities/service"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return apiErrors.forbidden()

  const { id } = await params

  try {
    const { count } = await generateOpportunitiesForClient(id)
    return NextResponse.json({ success: true, count })
  } catch (error) {
    if (error instanceof OpportunityServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("admin opportunities generation error", error)
    return NextResponse.json({ error: "Failed to generate opportunities" }, { status: 500 })
  }
}
