import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { sql } from "@/lib/db"

const RESET_TOKEN_TTL_MINUTES = 60
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function buildToken() {
  return randomBytes(32).toString("base64url")
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; locale?: "en" | "uk" }
    const email = String(body.email ?? "").trim().toLowerCase()
    const locale = body.locale === "uk" ? "uk" : "en"

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const users = await sql<Array<{ id: string }>>`
      select id
      from app_users
      where lower(email) = ${email}
      limit 1
    `
    const user = users[0]

    if (user) {
      const rawToken = buildToken()
      const tokenHash = hashToken(rawToken)
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)
      const appUrl = process.env.APP_URL || new URL(request.url).origin
      const resetUrl = `${appUrl}/${locale}/auth/reset-password?token=${rawToken}`

      await sql.begin(async (tx) => {
        await tx`
          update password_reset_tokens
          set used_at = now()
          where user_id = ${user.id}
            and used_at is null
        `
        await tx`
          insert into password_reset_tokens (user_id, token_hash, expires_at)
          values (${user.id}, ${tokenHash}, ${expiresAt})
        `
      })

      if (!resend || !process.env.MAIL_FROM) {
        console.error("Forgot-password email is not configured: missing RESEND_API_KEY or MAIL_FROM")
      } else {
        const subject =
          locale === "uk"
            ? "Скидання пароля для AI Readiness Portal"
            : "Reset your AI Readiness Portal password"
        const buttonLabel = locale === "uk" ? "Скинути пароль" : "Reset password"
        const intro =
          locale === "uk"
            ? "Ми отримали запит на скидання пароля."
            : "We received a request to reset your password."
          const outro =
            locale === "uk"
          ? "Якщо ви не надсилали цей запит, просто проігноруйте лист."
          : "If you didn’t request this, you can safely ignore this email."
      
            await resend.emails.send({
              from: process.env.MAIL_FROM!,
              to: email,
              subject,
              text: `${intro}\n\n${buttonLabel}: ${resetUrl}\n\n${outro}`,
              html: `
                <div style="font-family: Inter, Arial, sans-serif; background:#f6f7fb; padding:24px;">
                  <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px; border:1px solid #e8e8ef;">
                    <tr>
                      <td style="font-size:22px; font-weight:700; color:#111827; padding-bottom:8px;">
                        ${subject}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px; color:#4b5563; padding-bottom:20px;">
                        ${intro}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:20px;">
                        <a href="${resetUrl}"
                           style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-size:14px; font-weight:600;">
                          ${buttonLabel}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:12px; color:#6b7280; line-height:1.5;">
                        ${locale === "uk" ? "Посилання дійсне 60 хвилин." : "This link is valid for 60 minutes."}<br/>
                        ${outro}
                      </td>
                    </tr>
                  </table>
                </div>
              `,
            })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("forgot-password error", error)
    return NextResponse.json({ error: "Failed to process password reset" }, { status: 500 })
  }
}
