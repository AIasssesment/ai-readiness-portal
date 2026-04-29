import postgres from "postgres"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = postgres(connectionString, {
  ssl: "require",
})

export type AppUser = {
  id: string
  email: string
  full_name: string | null
}

export async function getUserByEmail(email: string) {
  const users = await sql<AppUser[]>`
    select id, email, full_name
    from app_users
    where lower(email) = lower(${email})
    limit 1
  `
  return users[0] ?? null
}
