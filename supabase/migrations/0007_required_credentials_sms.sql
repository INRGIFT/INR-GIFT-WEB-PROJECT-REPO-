-- 0007 · Every INRGIFT account requires email + password + a verified mobile number, and every session must pass an
-- SMS code (sent and checked by 2Factor.in through INRGIFT's server) before workspace data is reachable.
--
-- Who owns what:
--   Supabase Auth  identity, password, sessions, email confirmation (auth.users.email_confirmed_at) and the verified
--                  phone (auth.users.phone + phone_confirmed_at, written only by INRGIFT's server with the secret key
--                  after 2Factor.in confirms the code).
--   This schema    phone uniqueness (account_phones), SMS challenges (sms_challenges: 2Factor session ids, never the
--                  code) and per-session SMS step-ups (sms_step_ups, keyed by the Supabase session id). Clients can
--                  never write any of these; only the server's secret-key client can.
-- Workspace rows require: a password session (JWT amr), confirmed email and phone, and an SMS step-up for this very
-- session (JWT session_id). Signing out deletes the session and, by cascade, its step-up.

-- 1 · Remove the app-owned verification flag from migration 0005 ---------------------------------------------------
drop trigger if exists on_auth_user_phone_confirmed on auth.users;
drop function if exists public.sync_phone_verified();
drop trigger if exists guard_verification on public.profiles;
drop function if exists public.guard_profile_verification();
alter table public.profiles drop column if exists phone_verified;

-- 2 · Phone uniqueness --------------------------------------------------------------------------------------------
create table if not exists public.account_phones (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique check (phone ~ '^[1-9][0-9]{7,14}$'), -- E.164 digits without "+"
  updated_at timestamptz not null default now()
);
comment on table public.account_phones is 'One mobile number per account, unique across accounts. Uniqueness only, never a verification flag. Written by triggers; no client access.';
alter table public.account_phones enable row level security;
revoke all on public.account_phones from anon, authenticated;

create or replace function public.phone_digits(p text) returns text language sql immutable set search_path = '' as $$
  select nullif(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), '');
$$;

-- Whether a number is held by an account other than `me`: a confirmed phone, or a sign-up reservation. A reservation
-- from a sign-up whose email was never confirmed within 24 hours is abandoned, so nobody can squat on a number.
create or replace function public.phone_held_by_other(p text, me uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id is distinct from me and u.phone_confirmed_at is not null and public.phone_digits(u.phone) = public.phone_digits(p)
  ) or exists (
    select 1 from public.account_phones a join auth.users u on u.id = a.user_id
    where a.phone = public.phone_digits(p) and a.user_id is distinct from me
      and not (u.email_confirmed_at is null and u.phone_confirmed_at is null and u.created_at < now() - interval '24 hours')
  );
$$;
revoke execute on function public.phone_held_by_other(text, uuid) from public, anon, authenticated;

-- Used by /api/auth/phone-available. True when nobody else holds the number (the caller's own number counts as free).
create or replace function public.phone_available(p_phone text) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.phone_digits(p_phone) ~ '^[1-9][0-9]{7,14}$', false) and not public.phone_held_by_other(p_phone, auth.uid());
$$;
revoke execute on function public.phone_available(text) from public;
grant execute on function public.phone_available(text) to anon, authenticated;
-- Server only (secret key): availability for a given account, used before sending an SMS to a new number.
create or replace function public.phone_available_for(p_phone text, p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.phone_digits(p_phone) ~ '^[1-9][0-9]{7,14}$', false) and not public.phone_held_by_other(p_phone, p_user);
$$;
revoke execute on function public.phone_available_for(text, uuid) from public, anon, authenticated;
grant execute on function public.phone_available_for(text, uuid) to service_role;

-- Sign-up: the mobile number from the sign-up metadata is required and must be free; raising rolls back the account.
create or replace function public.reserve_signup_phone() returns trigger language plpgsql security definer set search_path = '' as $$
declare p text := public.phone_digits(new.raw_user_meta_data ->> 'phone');
begin
  if p is null or p !~ '^[1-9][0-9]{7,14}$' then
    raise exception 'INRGIFT: a mobile number with country code is required' using errcode = '23514';
  end if;
  if public.phone_held_by_other(p, new.id) then
    raise exception 'INRGIFT: that mobile number is already used by another account' using errcode = '23505';
  end if;
  delete from public.account_phones where phone = p; -- an abandoned reservation, if any
  insert into public.account_phones (user_id, phone) values (new.id, p);
  return new;
end $$;
revoke execute on function public.reserve_signup_phone() from public, anon, authenticated;
drop trigger if exists reserve_signup_phone on auth.users;
create trigger reserve_signup_phone after insert on auth.users for each row execute function public.reserve_signup_phone();

-- When the server confirms a phone (after 2Factor.in matched the code), the reservation follows that number; a number
-- held by another account is refused, so the update fails and the old number stays.
create or replace function public.follow_confirmed_phone() returns trigger language plpgsql security definer set search_path = '' as $$
declare p text := public.phone_digits(new.phone);
begin
  if new.phone_confirmed_at is null or p is null then return new; end if;
  if old.phone is not distinct from new.phone and old.phone_confirmed_at is not distinct from new.phone_confirmed_at then return new; end if;
  if public.phone_held_by_other(p, new.id) then
    raise exception 'INRGIFT: that mobile number is already used by another account' using errcode = '23505';
  end if;
  delete from public.account_phones where phone = p and user_id <> new.id; -- an abandoned reservation only (checked above)
  insert into public.account_phones (user_id, phone) values (new.id, p)
    on conflict (user_id) do update set phone = excluded.phone, updated_at = now();
  return new;
end $$;
revoke execute on function public.follow_confirmed_phone() from public, anon, authenticated;
drop trigger if exists follow_confirmed_phone on auth.users;
create trigger follow_confirmed_phone after update of phone, phone_confirmed_at on auth.users for each row execute function public.follow_confirmed_phone();

-- INRGIFT's second factor is the 2Factor.in SMS code, not Supabase MFA; no Supabase MFA factor may be enrolled, so no
-- other assurance path exists.
create or replace function public.refuse_mfa_factor() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'INRGIFT: second factors are SMS codes through INRGIFT, not Supabase MFA factors' using errcode = '23514';
end $$;
revoke execute on function public.refuse_mfa_factor() from public, anon, authenticated;
drop trigger if exists guard_mfa_factor on auth.mfa_factors;
drop trigger if exists refuse_mfa_factor on auth.mfa_factors;
create trigger refuse_mfa_factor before insert on auth.mfa_factors for each row execute function public.refuse_mfa_factor();

-- 3 · SMS challenges and per-session step-ups (server-written only) ----------------------------------------------------
create table if not exists public.sms_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references auth.sessions(id) on delete cascade,
  purpose text not null check (purpose in ('signup', 'login', 'change', 'reset')),
  phone text not null check (phone ~ '^[1-9][0-9]{7,14}$'),
  provider_session text not null, -- 2Factor.in OTP session id; the code itself is never stored
  attempts int not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create index if not exists sms_challenges_user_created on public.sms_challenges (user_id, created_at desc);
comment on table public.sms_challenges is 'One row per SMS code sent through 2Factor.in. Bound to a user and a Supabase session; single use. Server only.';
alter table public.sms_challenges enable row level security;
revoke all on public.sms_challenges from anon, authenticated;

create table if not exists public.sms_step_ups (
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  verified_at timestamptz not null default now()
);
comment on table public.sms_step_ups is 'A Supabase session that passed the SMS code (2Factor.in). Deleted with the session. Written by the server only.';
alter table public.sms_step_ups enable row level security;
revoke all on public.sms_step_ups from anon, authenticated;
grant select on public.sms_step_ups to authenticated;
drop policy if exists "owner reads own step-ups" on public.sms_step_ups;
create policy "owner reads own step-ups" on public.sms_step_ups for select to authenticated using (user_id = (select auth.uid()));

-- 4 · Workspace rows require a fully verified session ----------------------------------------------------------------
-- amr arrives as [{ "method": "...", "timestamp": n }] (Supabase) or plain strings (RFC 8176); accept both.
create or replace function public.session_fully_verified() returns boolean language sql stable security definer set search_path = '' as $$
  with claims as (select auth.jwt() as j),
       amr as (
         select coalesce(e ->> 'method', e #>> '{}') as method
         from claims, jsonb_array_elements(case when jsonb_typeof(claims.j -> 'amr') = 'array' then claims.j -> 'amr' else '[]'::jsonb end) e
       ),
       sid as (select case when (select j ->> 'session_id' from claims) ~* '^[0-9a-f-]{36}$' then (select j ->> 'session_id' from claims)::uuid end as id)
  -- Opened with the password or Google (OAuth); never a link, recovery or code session (src/features/auth/policy.ts).
  select exists (select 1 from amr where method in ('password', 'oauth'))
     and exists (select 1 from public.sms_step_ups s, sid where s.session_id = sid.id and s.user_id = auth.uid())
     and exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null and u.phone_confirmed_at is not null);
$$;
revoke execute on function public.session_fully_verified() from public, anon;
grant execute on function public.session_fully_verified() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'user_preferences', 'watchlists', 'watchlist_items', 'alerts', 'notifications',
                           'saved_screens', 'saved_comparisons', 'saved_research', 'notes', 'collections', 'recent_history'] loop
    execute format('drop policy if exists require_phone_mfa on public.%I', t);
    execute format('drop policy if exists require_verified_session on public.%I', t);
    execute format('create policy require_verified_session on public.%I as restrictive for all to authenticated '
                   'using ((select public.session_fully_verified())) with check ((select public.session_fully_verified()))', t);
  end loop;
end $$;
