-- Prisma Assessment.createdAt / updatedAt are non-nullable DateTime.
-- Legacy rows (or nullable columns) with NULL timestamps cause:
-- "Error converting field \"createdAt\" ... found incompatible value of \"null\"."

UPDATE assessments
SET
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, COALESCE(created_at, now()), now());

ALTER TABLE assessments
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE assessments
ALTER COLUMN updated_at SET NOT NULL,
ALTER COLUMN updated_at SET DEFAULT now();
