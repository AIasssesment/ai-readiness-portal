import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const rows = await sql<{ id: string; email: string; password_hash: string }[]>`
      select u.id, u.email, c.password_hash
      from app_users u
      join user_credentials c on c.user_id = u.id
      where lower(u.email) = ${email}
      limit 1
    `

    const user = rows[0]
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    await createSession({ id: user.id, email: user.email })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("login error", error)
    return NextResponse.json(
      { error: "Failed to sign in. Ensure table user_credentials exists." },
      { status: 500 },
    )
  }
}
