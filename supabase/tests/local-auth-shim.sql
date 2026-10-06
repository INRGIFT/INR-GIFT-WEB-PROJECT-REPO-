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
-- Same contract as Supabase: the user id comes from the JWT `sub` claim of the current request.
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
-- Supabase's default privileges on the public schema.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
