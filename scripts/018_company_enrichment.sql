-- LinkedIn company enrichment snapshots for Job Risk grounding (Apify connectors).

CREATE TABLE IF NOT EXISTS company_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  linkedin_url TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('pending', 'ready', 'failed', 'skipped')),
  apify_company_run_id TEXT,
  apify_jobs_run_id TEXT,
  sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT company_enrichment_client_unique UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS idx_company_enrichment_client_id
  ON company_enrichment (client_id);

CREATE INDEX IF NOT EXISTS idx_company_enrichment_status
  ON company_enrichment (status);
