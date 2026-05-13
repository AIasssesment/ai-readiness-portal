-- Aligns `assessments` with ai-portal-backend Prisma (GET /v1/reports/readiness/:id)
-- See prisma/schema.prisma model Assessment @@map("assessments")

ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS status_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN assessments.status_meta IS 'Readiness / report pipeline metadata (backend Prisma)';

-- Prisma: Float? → double precision
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS external_score DOUBLE PRECISION;

ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS external_confidence DOUBLE PRECISION;

ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS fpi_score DOUBLE PRECISION;

-- Prisma: Json @default("{}")
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS external_signals JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN assessments.external_score IS 'External readiness score (Prisma externalScore)';
COMMENT ON COLUMN assessments.external_confidence IS 'Confidence for external score (Prisma externalConfidence)';
COMMENT ON COLUMN assessments.fpi_score IS 'FPI score (Prisma fpiScore)';
COMMENT ON COLUMN assessments.external_signals IS 'Structured external signals (Prisma externalSignals)';
