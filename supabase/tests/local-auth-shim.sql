-- LOCAL TEST HARNESS ONLY. Never apply to a Supabase project: Supabase provides these objects itself.
-- Reproduces the parts of a Supabase database the INRGIFT migrations depend on, so migrations and RLS
-- policies can be executed and tested against a plain PostgreSQL 15+ server.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create extension if not exists pgcrypto;
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  email_confirmed_at timestamptz,
  phone_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
-- Sessions, as in Supabase (the JWT `session_id` claim is auth.sessions.id).
create table auth.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- MFA factors, as in Supabase (factor_type and status are enums there; text here, compared as text by migrations).
create table auth.mfa_factors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friendly_name text,
  factor_type text not null,
  status text not null default 'unverified',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Same contract as Supabase: claims of the current request's JWT. Tests set request.jwt.claims (full JSON) or the
-- legacy request.jwt.claim.sub.
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(auth.jwt() ->> 'sub', ''), nullif(current_setting('request.jwt.claim.sub', true), ''))::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;
-- Supabase's default privileges on the public schema.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
