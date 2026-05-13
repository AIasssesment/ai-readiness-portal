-- Tables and enums for ai-portal-backend Prisma (payments, report flow, webhooks, audit).
-- Error without payments: The table `public.payments` does not exist.
-- Enum names and column layout match prisma/schema.prisma (PostgreSQL provider).

-- ---------- enums (idempotent) ----------
DO $$ BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('monobank');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('pending_payment', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

DO $$ BEGIN
  CREATE TYPE "WebhookEventStatus" AS ENUM ('received', 'processed', 'ignored', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AuditActorType" AS ENUM ('system', 'user', 'webhook');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- payments ----------
CREATE TABLE IF NOT EXISTS payments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  provider "PaymentProvider" NOT NULL,
  provider_invoice_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status "PaymentStatus" NOT NULL DEFAULT 'pending_payment'::"PaymentStatus",
  return_url_success TEXT,
  return_url_fail TEXT,
  raw_create_payload JSONB NOT NULL,
  raw_webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  CONSTRAINT payments_provider_invoice_id_key UNIQUE (provider_invoice_id)
);

CREATE INDEX IF NOT EXISTS payments_client_id_idx ON payments (client_id);

-- ---------- report_requests (optional; invoice flow may create rows) ----------
CREATE TABLE IF NOT EXISTS report_requests (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments (id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments (id) ON DELETE SET NULL,
  mode "ReportRequestMode" NOT NULL,
  status "ReportRequestStatus" NOT NULL DEFAULT 'pending_payment'::"ReportRequestStatus",
  report_data_ready BOOLEAN NOT NULL DEFAULT false,
  missing_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  manual_due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  report_url TEXT,
  manual_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_requests_client_id_idx ON report_requests (client_id);
CREATE INDEX IF NOT EXISTS report_requests_assessment_id_idx ON report_requests (assessment_id);
CREATE INDEX IF NOT EXISTS report_requests_payment_id_idx ON report_requests (payment_id);

-- ---------- webhook_events ----------
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  provider "PaymentProvider" NOT NULL,
  event_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  status "WebhookEventStatus" NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_event_key_key UNIQUE (event_key)
);

-- ---------- audit_events ----------
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type "AuditActorType" NOT NULL,
  actor_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  meta JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_entity_type_entity_id_idx ON audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_events_event_type_idx ON audit_events (event_type);
