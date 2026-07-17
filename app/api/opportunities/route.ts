import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Opportunities are managed by an administrator" },
    { status: 403 },
  )
}
