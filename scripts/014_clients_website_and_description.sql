-- Canonical public-profile fields for assessment + settings + AI opportunities.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_website
  ON clients (website)
  WHERE website IS NOT NULL;
