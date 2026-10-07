-- GIFT ID: every INRGIFT account's permanent, human-facing account reference, for example GIFT-7K4M92PX.
--
-- * One account = one GIFT ID, assigned by the database when the profile row is created (email sign-up and Google
--   sign-up alike: both create auth.users → handle_new_user → profiles), never chosen, edited or reassigned.
-- * Format: "GIFT-" + 8 characters from Crockford's base32 alphabet (0-9 and A-Z without I, L, O, U, so it reads out
--   loud without confusion). 40 random bits from gen_random_uuid() (pg_strong_random), no personal data, not sequential.
-- * Unique for ever: every issued ID is kept in gift_id_registry, which has no foreign key and is never deleted, so an
--   ID is never reissued, even after its account is deleted (it is marked retired instead).
-- * Not a credential: nothing authenticates or authorises with it. RLS keeps authorising by auth.uid(); support uses
--   it as a reference only.
--
-- Independent of migration 0007 (SMS step-up): it applies to a database with or without 0007, and does not need it.
-- Apply this file on its own (SQL editor or `apply_migration`), never `supabase db push`, while 0007 must stay unapplied.
-- Reversal: the column, triggers and functions can be dropped, but gift_id_registry must be kept, or IDs could be reissued.

-- 1. Registry of every GIFT ID ever issued. Clients have no access at all; only the functions below and the service role.
create table public.gift_id_registry (
  gift_id text primary key check (gift_id ~ '^GIFT-[0-9A-HJKMNP-TV-Z]{8}$'),
  user_id uuid not null unique,
  assigned_at timestamptz not null default now(),
  retired_at timestamptz,
  unique (gift_id, user_id)
);
comment on table public.gift_id_registry is 'Every GIFT ID ever issued (never deleted, so never reissued). No client access; service role and security-definer functions only.';
alter table public.gift_id_registry enable row level security;
alter table public.gift_id_registry force row level security;
revoke all on public.gift_id_registry from public, anon, authenticated;

-- 2. Generator: GIFT- + 8 Crockford base32 characters from 40 random bits (bytes 0-4 of a v4 UUID are fully random).
create or replace function public.generate_gift_id() returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  b bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  bits bigint := 0;
  chars text := '';
begin
  for i in 0..4 loop bits := (bits << 8) | get_byte(b, i); end loop;
  for i in 1..8 loop chars := substr(alphabet, (bits & 31)::int + 1, 1) || chars; bits := bits >> 5; end loop;
  return 'GIFT-' || chars;
end $$;

-- 3. Assignment: the account's existing GIFT ID, or a new unique one. A candidate already issued to anyone (including
--    a retired account) is skipped; bounded retries, then a safe error. Concurrent sign-ups cannot share an ID: the
--    registry's primary key decides, and a second assignment for the same account returns the first.
create or replace function public.assign_gift_id(p_user uuid) returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  existing text;
  candidate text;
begin
  if p_user is null then raise exception 'assign_gift_id: an account id is required'; end if;
  select r.gift_id into existing from public.gift_id_registry r where r.user_id = p_user;
  if existing is not null then return existing; end if;
  for attempt in 1..20 loop
    candidate := public.generate_gift_id();
    insert into public.gift_id_registry (gift_id, user_id) values (candidate, p_user) on conflict do nothing;
    select r.gift_id into existing from public.gift_id_registry r where r.user_id = p_user;
    if existing is not null then return existing; end if;
  end loop;
  raise exception 'Could not assign a unique GIFT ID' using errcode = 'unique_violation';
end $$;

-- 4. profiles.gift_id: assigned by the database on insert (any value a client sends is ignored), immutable after.
alter table public.profiles add column gift_id text;
comment on column public.profiles.gift_id is 'GIFT ID: permanent account reference, assigned by the database, immutable. Never used for authentication or authorisation.';

create or replace function public.profiles_assign_gift_id() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.gift_id := public.assign_gift_id(new.user_id);
  return new;
end $$;
create trigger assign_gift_id before insert on public.profiles for each row execute function public.profiles_assign_gift_id();

create or replace function public.profiles_lock_gift_id() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.gift_id is distinct from old.gift_id then
    -- The only change ever allowed: the one-time backfill from no ID to the ID registered for this same account.
    if old.gift_id is null and new.gift_id = (select r.gift_id from public.gift_id_registry r where r.user_id = new.user_id) then return new; end if;
    raise exception 'gift_id is a permanent account reference and cannot be changed' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger lock_gift_id before update of gift_id on public.profiles for each row execute function public.profiles_lock_gift_id();

-- 5. Retirement: deleting an account keeps its registry row (the ID is never reissued) and marks it retired.
create or replace function public.retire_gift_id() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.gift_id_registry set retired_at = now() where user_id = old.id and retired_at is null;
  return old;
end $$;
create trigger retire_gift_id after delete on auth.users for each row execute function public.retire_gift_id();

-- 6. Backfill. First a profile for every account that has none (the insert trigger gives it a GIFT ID), then a GIFT ID
--    for every existing profile. Supabase user ids, emails, passwords, identities and phones are not touched.
insert into public.profiles (user_id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name' from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id);
update public.profiles set gift_id = public.assign_gift_id(user_id) where gift_id is null;

-- 7. Constraints, after the backfill: required, unique (indexed, for support lookups) and registered to this account.
alter table public.profiles alter column gift_id set not null;
alter table public.profiles add constraint profiles_gift_id_key unique (gift_id);
alter table public.profiles add constraint profiles_gift_id_registered foreign key (gift_id, user_id) references public.gift_id_registry (gift_id, user_id);

-- 8. Support lookup by GIFT ID (service role only: support staff tools, never the browser).
create or replace function public.account_by_gift_id(p_gift_id text) returns table (user_id uuid, retired boolean) language sql stable security definer set search_path = '' as $$
  select r.user_id, r.retired_at is not null from public.gift_id_registry r where r.gift_id = upper(btrim(p_gift_id));
$$;

-- 9. None of these functions is callable through the API by visitors or signed-in users.
revoke execute on function public.generate_gift_id() from public, anon, authenticated;
revoke execute on function public.assign_gift_id(uuid) from public, anon, authenticated;
revoke execute on function public.profiles_assign_gift_id() from public, anon, authenticated;
revoke execute on function public.profiles_lock_gift_id() from public, anon, authenticated;
revoke execute on function public.retire_gift_id() from public, anon, authenticated;
revoke execute on function public.account_by_gift_id(text) from public, anon, authenticated;
grant execute on function public.account_by_gift_id(text) to service_role;

-- 10. Verification: every account has exactly one GIFT ID, and no two accounts share one.
do $$
declare
  accounts bigint; distinct_ids bigint; missing bigint; duplicates bigint; registry_mismatch bigint;
begin
  select count(*) into accounts from auth.users;
  select count(distinct p.gift_id) into distinct_ids from public.profiles p join auth.users u on u.id = p.user_id;
  select count(*) into missing from auth.users u left join public.profiles p on p.user_id = u.id where p.gift_id is null;
  select count(*) into duplicates from (select gift_id from public.profiles group by gift_id having count(*) > 1) d;
  select count(*) into registry_mismatch from public.profiles p left join public.gift_id_registry r on r.gift_id = p.gift_id and r.user_id = p.user_id where r.gift_id is null;
  if accounts <> distinct_ids or missing <> 0 or duplicates <> 0 or registry_mismatch <> 0 then
    raise exception 'GIFT ID verification failed: accounts %, distinct GIFT IDs %, missing %, duplicates %, unregistered %', accounts, distinct_ids, missing, duplicates, registry_mismatch;
  end if;
end $$;
