create table if not exists user_credentials (
  user_id uuid primary key references app_users(id) on delete cascade,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_credentials_updated_at on user_credentials;
create trigger trg_user_credentials_updated_at
before update on user_credentials
for each row execute function set_updated_at();
