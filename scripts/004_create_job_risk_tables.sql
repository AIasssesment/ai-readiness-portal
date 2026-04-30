CREATE TABLE IF NOT EXISTS job_risk_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  overall_risk_score NUMERIC(3,2) NOT NULL,
  executive_summary TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES job_risk_reports(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  department TEXT,
  risk_score NUMERIC(3,2) NOT NULL,
  timeline_months_min INT,
  timeline_months_max INT,
  tasks_at_risk JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks_safe JSONB NOT NULL DEFAULT '[]'::jsonb,
  reskilling_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasoning TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_risk_reports_client_id ON job_risk_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_job_risks_report_id ON job_risks(report_id);
