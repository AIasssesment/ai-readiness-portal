select count(*) as null_ids from app_users where id is null;
select id, count(*)
from app_users
group by id
having count(*) > 1;


alter table app_users
  alter column id set default gen_random_uuid(),
  alter column id set not null;

alter table app_users
  add constraint app_users_pkey primary key (id);

create extension if not exists pgcrypto;

create table if not exists auth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create index if not exists idx_auth_identities_user_id on auth_identities(user_id);
create index if not exists idx_auth_identities_email on auth_identities(lower(email));
