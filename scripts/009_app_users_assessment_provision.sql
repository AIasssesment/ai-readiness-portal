-- Temporary assessment signup: delete after deadline if password not changed (cleared on password update).
alter table app_users
  add column if not exists assessment_provision_expires_at timestamptz;

comment on column app_users.assessment_provision_expires_at is
  'When set, user must change password before this time or account may be removed; cleared after password change.';
