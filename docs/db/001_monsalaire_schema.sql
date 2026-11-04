-- monsalaire: subscriber accounts and contact messages, in the aconta-preview Supabase project.
-- Run once in the Supabase SQL editor of aconta-preview. The role password is set as a SCRAM verifier (a hash):
-- the real file run on 4 November 2026 had the verifier in place of :ROLE_VERIFIER; the clear password only lives in
-- the Vercel variable MONSALAIRE_DATABASE_URL.
--
-- Isolation: the role monsalaire_app can use the schema monsalaire and nothing else; anon and authenticated (the
-- Supabase API roles) have no access to it, so neither the public API nor Aconta's code can read these tables, and a
-- flaw in monsalaire cannot reach Aconta's data.

begin;

create schema monsalaire;

create table monsalaire.accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and length(email) between 3 and 254),
  password_hash text not null,
  lang text not null default 'fr' check (lang in ('fr', 'en')),
  verified_at timestamptz,
  newsletter boolean not null default true,
  created_at timestamptz not null default now()
);

create table monsalaire.codes (
  id bigserial primary key,
  email text not null,
  purpose text not null check (purpose in ('verify', 'reset')),
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index on monsalaire.codes (email, purpose, created_at desc);

create table monsalaire.sessions (
  token_hash text primary key,
  account_id uuid not null references monsalaire.accounts (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table monsalaire.messages (
  id bigserial primary key,
  name text not null check (length(name) <= 120),
  email text not null check (length(email) <= 254),
  body text not null check (length(body) between 1 and 5000),
  lang text not null default 'fr',
  ip_hash text,
  created_at timestamptz not null default now()
);

create table monsalaire.rate_events (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index on monsalaire.rate_events (key, created_at desc);

-- No access for the public API roles.
revoke all on schema monsalaire from public, anon, authenticated;
revoke all on all tables in schema monsalaire from public, anon, authenticated;

-- The one role monsalaire connects with.
create role monsalaire_app login noinherit connection limit 20 password ':ROLE_VERIFIER';
grant usage on schema monsalaire to monsalaire_app;
grant select, insert, update, delete on all tables in schema monsalaire to monsalaire_app;
grant usage, select on all sequences in schema monsalaire to monsalaire_app;
alter role monsalaire_app set search_path = monsalaire;

-- Row level security on, open to monsalaire_app only.
alter table monsalaire.accounts enable row level security;
alter table monsalaire.codes enable row level security;
alter table monsalaire.sessions enable row level security;
alter table monsalaire.messages enable row level security;
alter table monsalaire.rate_events enable row level security;
create policy app_all on monsalaire.accounts for all to monsalaire_app using (true) with check (true);
create policy app_all on monsalaire.codes for all to monsalaire_app using (true) with check (true);
create policy app_all on monsalaire.sessions for all to monsalaire_app using (true) with check (true);
create policy app_all on monsalaire.messages for all to monsalaire_app using (true) with check (true);
create policy app_all on monsalaire.rate_events for all to monsalaire_app using (true) with check (true);

commit;
