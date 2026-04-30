-- Adds server-side paywall flag for detailed reports
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS has_extended_access BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_clients_has_extended_access
ON clients(has_extended_access);
