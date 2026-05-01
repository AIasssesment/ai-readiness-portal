CREATE TABLE IF NOT EXISTS external_role_risk_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_role TEXT NOT NULL UNIQUE,
  display_role TEXT NOT NULL,
  risk_score_0_1 NUMERIC(4,3) NOT NULL CHECK (risk_score_0_1 >= 0 AND risk_score_0_1 <= 1),
  source TEXT NOT NULL DEFAULT 'kaggle',
  source_dataset TEXT,
  version_tag TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  normalized_role TEXT NOT NULL,
  department TEXT,
  employee_count INT NOT NULL CHECK (employee_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, normalized_role)
);

ALTER TABLE job_risks
  ADD COLUMN IF NOT EXISTS employee_count INT,
  ADD COLUMN IF NOT EXISTS at_risk_headcount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS benchmark_risk_score NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS risk_data_source TEXT;

CREATE INDEX IF NOT EXISTS idx_workforce_roles_client_id ON workforce_roles(client_id);
CREATE INDEX IF NOT EXISTS idx_workforce_roles_normalized_role ON workforce_roles(normalized_role);
CREATE INDEX IF NOT EXISTS idx_benchmarks_normalized_role ON external_role_risk_benchmarks(normalized_role);

INSERT INTO external_role_risk_benchmarks (normalized_role, display_role, risk_score_0_1, source, source_dataset, version_tag)
VALUES
  ('customer support representative', 'Customer Support Representative', 0.81, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('graphic designer', 'Graphic Designer', 0.58, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('accounts payable clerk', 'Accounts Payable Clerk', 0.86, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('bookkeeper', 'Bookkeeper', 0.84, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('data entry clerk', 'Data Entry Clerk', 0.92, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('sales development representative', 'Sales Development Representative', 0.63, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('inside sales representative', 'Inside Sales Representative', 0.61, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('marketing coordinator', 'Marketing Coordinator', 0.56, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('content writer', 'Content Writer', 0.73, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('hr specialist', 'HR Specialist', 0.48, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('recruiter', 'Recruiter', 0.46, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('operations coordinator', 'Operations Coordinator', 0.67, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('project manager', 'Project Manager', 0.39, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('software engineer', 'Software Engineer', 0.37, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('it support specialist', 'IT Support Specialist', 0.54, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1'),
  ('financial analyst', 'Financial Analyst', 0.52, 'kaggle', 'khushikyad001/ai-automation-risk-by-job-role', 'v1')
ON CONFLICT (normalized_role) DO NOTHING;
