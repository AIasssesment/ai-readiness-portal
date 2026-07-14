-- Company intelligence snapshot (canonical context for opportunity generation)
-- and richer opportunity fields for AI / manual use cases.

CREATE TABLE IF NOT EXISTS company_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'llm' CHECK (source IN ('llm', 'manual', 'import')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT company_intelligence_client_unique UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_client_id
  ON company_intelligence (client_id);

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'assessment',
  ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS decision_makers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS why_relevant TEXT,
  ADD COLUMN IF NOT EXISTS relevance_score INTEGER,
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER,
  ADD COLUMN IF NOT EXISTS savings_assumptions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS business_problem TEXT,
  ADD COLUMN IF NOT EXISTS proposed_solution TEXT;

UPDATE opportunities
SET source = 'assessment'
WHERE source IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_source_check'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_source_check
      CHECK (source IN ('assessment', 'ai', 'manual'));
  END IF;
END $$;

ALTER TABLE opportunities
  ALTER COLUMN source SET DEFAULT 'assessment',
  ALTER COLUMN source SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_source
  ON opportunities (client_id, source);
