import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Opportunity generation is available only to administrators" },
    { status: 403 },
  )
}
