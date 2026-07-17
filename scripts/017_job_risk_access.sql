-- Job Risk gating: requires a LinkedIn URL on the client profile and a paid unlock.
-- LinkedIn lives on the client; the unlock is a separate paid product from the
-- extended assessment report, tracked in its own table.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS linkedin TEXT;

CREATE TABLE IF NOT EXISTS job_risk_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'ready', 'failed')),
  amount INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  provider TEXT,
  provider_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT job_risk_unlocks_client_unique UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS idx_job_risk_unlocks_client
  ON job_risk_unlocks (client_id);
