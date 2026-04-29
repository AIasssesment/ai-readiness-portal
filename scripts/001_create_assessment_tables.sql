-- AI Readiness Assessment Database Schema
-- This creates tables for storing assessments, clients, and opportunities

-- Clients table (for client portal access)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL DEFAULT 0,
  readiness_level TEXT NOT NULL DEFAULT 'emerging',
  dimension_scores JSONB NOT NULL DEFAULT '{}',
  answers JSONB NOT NULL DEFAULT '{}',
  company_info JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Opportunities identified from assessments
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  complexity TEXT CHECK (complexity IN ('low', 'medium', 'high')),
  estimated_hours_saved_weekly INTEGER DEFAULT 0,
  estimated_annual_savings DECIMAL(12,2) DEFAULT 0,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  implementation_timeline TEXT,
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'in_review', 'approved', 'in_progress', 'completed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit reports generated for clients
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'basic' CHECK (report_type IN ('basic', 'extended', 'full')),
  content JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "clients_select_own" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_insert_own" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update_own" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_delete_own" ON clients FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assessments (via client relationship)
CREATE POLICY "assessments_select_own" ON assessments FOR SELECT 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
CREATE POLICY "assessments_insert_own" ON assessments FOR INSERT 
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
CREATE POLICY "assessments_update_own" ON assessments FOR UPDATE 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS Policies for opportunities (via client relationship)
CREATE POLICY "opportunities_select_own" ON opportunities FOR SELECT 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
CREATE POLICY "opportunities_update_own" ON opportunities FOR UPDATE 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS Policies for audit_reports (via client relationship)
CREATE POLICY "audit_reports_select_own" ON audit_reports FOR SELECT 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_client_id ON assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assessment_id ON opportunities(assessment_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_client_id ON audit_reports(client_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
