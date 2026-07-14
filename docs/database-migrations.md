# Database migrations

SQL files live in `scripts/` as `NNN_description.sql` (e.g. `012_….sql`).

## Commands

```bash
npm run db:migrate:status    # applied vs pending
npm run db:migrate           # apply pending only (tracked in schema_migrations)
npm run db:migrate:baseline  # mark all current SQL as applied WITHOUT running
```

Requires `DATABASE_URL` in `.env` or the environment.

## Prod / existing databases

If you already ran SQL manually (Neon SQL editor / one-off scripts):

1. `npm run db:migrate:baseline` once on that database — records filenames, does not re-execute.
2. Later `npm run db:migrate` applies only **new** files.

Fresh database: skip baseline, just `npm run db:migrate` (runs `001`… in order).

## Notes

- Tracking table: `public.schema_migrations`
- Only files matching `^\d{3}_.+\.sql$` are migrations (`migrate.mjs` itself is ignored)
- Prefer idempotent SQL (`IF NOT EXISTS`) as defense in depth; the history table is the real skip logic
