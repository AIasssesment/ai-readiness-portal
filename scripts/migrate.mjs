#!/usr/bin/env node
/**
 * Idempotent SQL migrator for Neon / Postgres.
 *
 * Usage:
 *   npm run db:migrate              Apply pending scripts/*.sql
 *   npm run db:migrate:status       Show applied / pending
 *   npm run db:migrate:baseline     Mark all current SQL as applied (no execute)
 *
 * Tracks applied files in public.schema_migrations.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import postgres from "postgres"

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

try {
  require("dotenv").config({ path: path.join(ROOT, ".env") })
  require("dotenv").config({ path: path.join(ROOT, ".env.local") })
} catch {
  // optional; DATABASE_URL may already be in the environment
}

const MIGRATIONS_DIR = path.join(ROOT, "scripts")
const TABLE = "schema_migrations"

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }
  return url
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return []
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d{3}_.+\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "en"))
}

async function ensureMigrationsTable(sql) {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum TEXT
    )
  `)
}

function fileChecksum(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex")
}

async function getApplied(sql) {
  const rows = await sql.unsafe(`SELECT filename FROM ${TABLE} ORDER BY filename`)
  return new Set(rows.map((row) => row.filename))
}

async function status() {
  const sql = postgres(getDatabaseUrl(), { ssl: "require", max: 1 })
  try {
    await ensureMigrationsTable(sql)
    const applied = await getApplied(sql)
    const files = listMigrationFiles()
    console.log(`Migrations dir: scripts/ (${files.length} files)\n`)
    for (const file of files) {
      const mark = applied.has(file) ? "applied" : "pending"
      console.log(`  [${mark}] ${file}`)
    }
    const pending = files.filter((f) => !applied.has(f))
    console.log(`\nPending: ${pending.length}`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function baseline() {
  const sql = postgres(getDatabaseUrl(), { ssl: "require", max: 1 })
  try {
    await ensureMigrationsTable(sql)
    const applied = await getApplied(sql)
    const files = listMigrationFiles()
    let marked = 0
    for (const file of files) {
      if (applied.has(file)) continue
      const contents = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8")
      const checksum = fileChecksum(contents)
      await sql.unsafe(
        `INSERT INTO ${TABLE} (filename, checksum) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING`,
        [file, checksum],
      )
      console.log(`  baselined ${file}`)
      marked += 1
    }
    console.log(`\nBaseline complete. Marked ${marked} file(s) as applied (not executed).`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function migrate() {
  const sql = postgres(getDatabaseUrl(), { ssl: "require", max: 1 })
  try {
    await ensureMigrationsTable(sql)
    const applied = await getApplied(sql)
    const files = listMigrationFiles()
    const pending = files.filter((f) => !applied.has(f))

    if (pending.length === 0) {
      console.log("No pending migrations.")
      return
    }

    console.log(`Applying ${pending.length} migration(s)…\n`)

    for (const file of pending) {
      const fullPath = path.join(MIGRATIONS_DIR, file)
      const contents = fs.readFileSync(fullPath, "utf8")
      const checksum = fileChecksum(contents)

      console.log(`→ ${file}`)
      try {
        await sql.begin(async (tx) => {
          await tx.unsafe(contents)
          await tx.unsafe(
            `INSERT INTO ${TABLE} (filename, checksum) VALUES ($1, $2)`,
            [file, checksum],
          )
        })
        console.log(`  ok`)
      } catch (error) {
        console.error(`  FAILED: ${error instanceof Error ? error.message : error}`)
        process.exitCode = 1
        return
      }
    }

    console.log("\nAll pending migrations applied.")
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main() {
  const cmd = process.argv[2] || "up"
  if (cmd === "status") return status()
  if (cmd === "baseline") return baseline()
  if (cmd === "up" || cmd === "deploy") return migrate()
  console.error(`Unknown command: ${cmd}`)
  console.error("Use: up | status | baseline")
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
