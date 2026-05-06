import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth/password"
import { sql } from "@/lib/db"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; password?: string }
    const token = String(body.token ?? "").trim()
    const password = String(body.password ?? "")

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const tokenHash = hashToken(token)
    const passwordHash = await hashPassword(password)

    const result = await sql.begin(async (tx) => {
      const tokens = await tx<Array<{ id: string; user_id: string }>>`
        select id, user_id
        from password_reset_tokens
        where token_hash = ${tokenHash}
          and used_at is null
          and expires_at > now()
        limit 1
      `
      const row = tokens[0]
      if (!row) return { error: "Invalid or expired reset token" }

      await tx`
        insert into user_credentials (user_id, password_hash)
        values (${row.user_id}, ${passwordHash})
        on conflict (user_id)
        do update set password_hash = excluded.password_hash
      `
      await tx`
        update password_reset_tokens
        set used_at = now()
        where id = ${row.id}
      `

      return { success: true }
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("reset-password error", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
