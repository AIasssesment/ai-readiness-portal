import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const companyName = String(body.companyName ?? "").trim()
    const contactName = String(body.contactName ?? "").trim()

    if (!email || !password || !companyName || !contactName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const result = await sql.begin(async (tx) => {
      const existing = await tx<{ id: string }[]>`
        select id from app_users where lower(email) = ${email} limit 1
      `
      if (existing[0]) return { error: "User with this email already exists" }

      const users = await tx<{ id: string; email: string }[]>`
        insert into app_users (email, full_name)
        values (${email}, ${contactName})
        returning id, email
      `
      const user = users[0]

      await tx`
        insert into user_credentials (user_id, password_hash)
        values (${user.id}, ${passwordHash})
      `

      await tx`
        insert into clients (id, user_id, company_name, contact_name, contact_email)
        values (gen_random_uuid(), ${user.id}, ${companyName}, ${contactName}, ${email})
      `

      return { user }
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    await createSession({
      id: result.user.id,
      email: result.user.email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("sign-up error", error)
    return NextResponse.json(
      { error: "Failed to create account. Ensure table user_credentials exists." },
      { status: 500 },
    )
  }
}
