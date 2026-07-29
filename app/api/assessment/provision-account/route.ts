import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { apiErrors } from "@/lib/http/api-errors"
import { t, type Locale } from "@/lib/i18n"

const PROVISION_TTL_HOURS = 48

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function generateTempPassword() {
  return randomBytes(18).toString("base64url").slice(0, 24)
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function buildResetToken() {
  return randomBytes(32).toString("base64url")
}

function companyLabelFromWebsite(urlStr: string): string {
  try {
    const u = new URL(urlStr)
    return u.hostname.replace(/^www\./i, "") || urlStr.trim()
  } catch {
    return urlStr.trim()
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      firstName?: string
      lastName?: string
      companyName?: string
      website?: string
      locale?: string
    }

    const email = String(body.email ?? "").trim().toLowerCase()
    const firstName = String(body.firstName ?? "").trim()
    const lastName = String(body.lastName ?? "").trim()
    const companyWebsite = String(body.website ?? body.companyName ?? "").trim()
    const locale: Locale = body.locale === "uk" ? "uk" : "en"

    if (!email || !firstName || !lastName || !companyWebsite) {
      return apiErrors.badRequest("Missing required fields")
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiErrors.badRequest("Invalid email")
    }

    const existing = await sql<Array<{ id: string }>>`
      select id from app_users where lower(email) = ${email} limit 1
    `
    if (existing[0]) {
      return NextResponse.json({ ok: true, existingUser: true })
    }

    const contactName = `${firstName} ${lastName}`.trim()
    const companyName = String(body.companyName ?? "").trim() || companyLabelFromWebsite(companyWebsite)
    const plainPassword = generateTempPassword()
    const passwordHash = await hashPassword(plainPassword)
    const expiresAt = new Date(Date.now() + PROVISION_TTL_HOURS * 60 * 60 * 1000)

    const appUrl = process.env.APP_URL || new URL(request.url).origin

    const rawResetToken = buildResetToken()
    const resetTokenHash = hashResetToken(rawResetToken)
    const resetTokenExpiresAt = new Date(Date.now() + PROVISION_TTL_HOURS * 60 * 60 * 1000)

    let userId: string | undefined

    await sql.begin(async (tx) => {
      const users = await tx<Array<{ id: string }>>`
        insert into app_users (email, full_name)
        values (${email}, ${contactName})
        returning id
      `
      const insertedId = users[0]?.id
      if (!insertedId) throw new Error("insert user failed")
      userId = insertedId

      await tx`
        insert into user_credentials (user_id, password_hash)
        values (${userId}, ${passwordHash})
      `

      await tx`
        insert into clients (
          id, user_id, company_name, contact_name, contact_email,
          website
        )
        values (
          gen_random_uuid(), ${userId}, ${companyName}, ${contactName}, ${email},
          ${companyWebsite}
        )
      `

      await tx`
        update password_reset_tokens
        set used_at = now()
        where user_id = ${userId}
          and used_at is null
      `
      await tx`
        insert into password_reset_tokens (user_id, token_hash, expires_at)
        values (${userId}, ${resetTokenHash}, ${resetTokenExpiresAt})
      `
    })

    if (!userId) {
      return apiErrors.internal("Failed to create account")
    }

    const resetPasswordUrl = `${appUrl}/${locale}/auth/reset-password?token=${encodeURIComponent(rawResetToken)}`

    await createSession({ id: userId, email })

    if (!resend || !process.env.MAIL_FROM) {
      console.error("provision-account: RESEND_API_KEY or MAIL_FROM missing; account created but email not sent")
    } else {
      const subject = t(locale, "email.assessmentProvision.subject")
      const intro = t(locale, "email.assessmentProvision.intro")
      const pwdLabel = t(locale, "email.assessmentProvision.passwordLine")
      const deadlineText = t(locale, "email.assessmentProvision.deadline").replace(
        "{deadline}",
        expiresAt.toLocaleString(locale === "uk" ? "uk-UA" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      )
      const setPasswordCta = t(locale, "email.assessmentProvision.setPasswordCta")
      const footer = t(locale, "email.assessmentProvision.footer")

      const textBody = [
        intro,
        "",
        `${pwdLabel} ${plainPassword}`,
        "",
        deadlineText,
        "",
        `${setPasswordCta}: ${resetPasswordUrl}`,
        "",
        footer,
      ].join("\n")

      await resend.emails.send({
        from: process.env.MAIL_FROM!,
        to: email,
        subject,
        text: textBody,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; background:#f6f7fb; padding:24px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px; border:1px solid #e8e8ef;">
              <tr><td style="font-size:14px; color:#4b5563; padding-bottom:16px;">${intro}</td></tr>
              <tr><td style="font-size:15px; font-weight:600; color:#111827; padding:12px 0;">${pwdLabel}</td></tr>
              <tr><td style="font-size:16px; font-family:monospace; background:#f3f4f6; padding:12px 16px; border-radius:8px; color:#111827;">${plainPassword}</td></tr>
              <tr><td style="font-size:13px; color:#6b7280; padding-top:16px; line-height:1.5;">${deadlineText}</td></tr>
              <tr><td style="padding-top:20px;">
                <a href="${resetPasswordUrl}" style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-size:14px; font-weight:600;">${setPasswordCta}</a>
              </td></tr>
              <tr><td style="font-size:12px; color:#6b7280; padding-top:20px;">${footer}</td></tr>
            </table>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true, existingUser: false })
  } catch (error) {
    console.error("provision-account error", error)
    const code =
      error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : ""
    if (code === "42P01") {
      return apiErrors.internal(
        "Database migration required: run scripts/011_create_password_reset_tokens.sql in Neon",
      )
    }
    return apiErrors.internal("Failed to create account")
  }
}
