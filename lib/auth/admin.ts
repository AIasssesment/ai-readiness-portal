import { sql } from "@/lib/db"
import { getSessionUser, type SessionUser } from "@/lib/auth/session"

export type AdminUser = SessionUser & { role: string }

/** Reads the current user's role from the database (null when logged out). */
export async function getSessionUserRole(): Promise<string | null> {
  const user = await getSessionUser()
  if (!user) return null

  const rows = await sql<Array<{ role: string | null }>>`
    select role from app_users where id = ${user.id}::uuid limit 1
  `
  return rows[0]?.role ?? "user"
}

/** Returns the admin user or null. Use as the single gate for admin pages/APIs. */
export async function requireAdmin(): Promise<AdminUser | null> {
  const user = await getSessionUser()
  if (!user) return null

  const rows = await sql<Array<{ role: string | null }>>`
    select role from app_users where id = ${user.id}::uuid limit 1
  `
  const role = rows[0]?.role ?? "user"
  if (role !== "admin") return null

  return { ...user, role }
}
