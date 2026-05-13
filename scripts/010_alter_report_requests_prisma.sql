-- Legacy `report_requests` (e.g. hand-written) often lacks Prisma columns.
-- CREATE TABLE IF NOT EXISTS in 009 does not alter an existing table.
-- Fixes: column `report_data_ready` does not exist (reportRequest.create).

-- Enums required if you add mode/status later (safe no-op if types exist)
DO $$ BEGIN
  CREATE TYPE "ReportRequestMode" AS ENUM ('auto', 'manual_followup');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportRequestStatus" AS ENUM (
    'pending_payment',
    'paid',
    'pending_manual',
    'ready',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE report_requests
  ADD COLUMN IF NOT EXISTS report_data_ready BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS missing_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS manual_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_url TEXT,
  ADD COLUMN IF NOT EXISTS manual_notes TEXT;

-- Optional FK column (ignored if column already exists)
ALTER TABLE report_requests
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments (id) ON DELETE SET NULL;

-- Prisma expects updated_at on every row
ALTER TABLE report_requests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE report_requests
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS report_requests_payment_id_idx ON report_requests (payment_id);
