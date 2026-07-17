-- Admin review gate for client-visible opportunities.
-- Backfill runs only when the column is first introduced, keeping reruns safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'opportunities'
      AND column_name = 'publication_status'
  ) THEN
    ALTER TABLE opportunities
      ADD COLUMN publication_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publication_status IN ('draft', 'published'));

    UPDATE opportunities
    SET publication_status = 'published';
  END IF;
END
$$;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES app_users(id) ON DELETE SET NULL;

-- Preserve the current client experience for records created before this workflow.
UPDATE opportunities
SET published_at = created_at
WHERE publication_status = 'published'
  AND published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_client_publication
  ON opportunities (client_id, publication_status);

-- Apply an additional database-level gate only in Supabase environments.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    EXECUTE 'DROP POLICY IF EXISTS "opportunities_select_own" ON opportunities';
    EXECUTE $policy$
      CREATE POLICY "opportunities_select_own" ON opportunities FOR SELECT
      USING (
        publication_status = 'published'
        AND client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
      )
    $policy$;
    EXECUTE 'DROP POLICY IF EXISTS "opportunities_update_own" ON opportunities';
  END IF;
END
$$;
