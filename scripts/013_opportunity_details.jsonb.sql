-- Structured display metadata for opportunities (ROI, capabilities, integrations, evidence).

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
