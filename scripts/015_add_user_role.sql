-- Role-based access for the internal admin panel.
-- Everyone defaults to 'user'; promote admins manually:
--   UPDATE app_users SET role = 'admin' WHERE lower(email) = lower('you@example.com');

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_app_users_role
  ON app_users (role)
  WHERE role <> 'user';
