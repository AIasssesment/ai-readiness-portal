import "server-only"

import { sql } from "@/lib/db"

/** Resolve clients.id for the logged-in app user (identity only; domain data stays on Nest). */
export async function resolveClientIdForUser(userId: string): Promise<string | null> {
  const rows = await sql<Array<{ id: string }>>`
    select id
    from clients
    where user_id = ${userId}
    limit 1
  `
  return rows[0]?.id ?? null
}
