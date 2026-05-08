import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

/** Deletes accounts that never changed the temporary assessment password before the deadline. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 501 })
  }

  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const removed = await sql`
      delete from app_users
      where assessment_provision_expires_at is not null
        and assessment_provision_expires_at < now()
      returning id
    `
    return NextResponse.json({
      ok: true,
      deletedCount: Array.isArray(removed) ? removed.length : 0,
    })
  } catch (e) {
    console.error("cleanup-provisioned-users", e)
    return NextResponse.json({ ok: false, error: "Cleanup failed" }, { status: 500 })
  }
}
