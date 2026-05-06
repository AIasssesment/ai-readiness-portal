import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { apiErrors } from "@/lib/http/api-errors"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (!email || !password) {
      return apiErrors.badRequest("Email and password are required")
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
      return apiErrors.unauthorized("Invalid email or password")
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return apiErrors.unauthorized("Invalid email or password")
    }

    await createSession({ id: user.id, email: user.email })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("login error", error)
    return apiErrors.internal("Failed to sign in. Ensure table user_credentials exists.")
  }
}
