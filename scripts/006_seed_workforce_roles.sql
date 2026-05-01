-- Seed workforce roles for existing clients (demo/default data).
-- Safe to run multiple times due to ON CONFLICT.

INSERT INTO workforce_roles (client_id, role_title, normalized_role, department, employee_count)
SELECT
  c.id,
  seed.role_title,
  seed.normalized_role,
  seed.department,
  seed.employee_count
FROM clients c
CROSS JOIN (
  VALUES
    ('Customer Support Representative', 'customer support representative', 'Customer Support', 60),
    ('Graphic Designer', 'graphic designer', 'Marketing', 40),
    ('Accounts Payable Clerk', 'accounts payable clerk', 'Finance', 25),
    ('Bookkeeper', 'bookkeeper', 'Finance', 20),
    ('Data Entry Clerk', 'data entry clerk', 'Operations', 35),
    ('Sales Development Representative', 'sales development representative', 'Sales', 55),
    ('Inside Sales Representative', 'inside sales representative', 'Sales', 30),
    ('Marketing Coordinator', 'marketing coordinator', 'Marketing', 25),
    ('Content Writer', 'content writer', 'Marketing', 18),
    ('HR Specialist', 'hr specialist', 'HR', 12),
    ('Recruiter', 'recruiter', 'HR', 10),
    ('Operations Coordinator', 'operations coordinator', 'Operations', 40),
    ('Project Manager', 'project manager', 'Operations', 14),
    ('Software Engineer', 'software engineer', 'IT', 36),
    ('IT Support Specialist', 'it support specialist', 'IT', 30),
    ('Financial Analyst', 'financial analyst', 'Finance', 20)
) AS seed(role_title, normalized_role, department, employee_count)
ON CONFLICT (client_id, normalized_role) DO UPDATE
SET
  role_title = EXCLUDED.role_title,
  department = EXCLUDED.department,
  employee_count = EXCLUDED.employee_count,
  updated_at = NOW();
