-- GIFT ID tests (migration 0008). Run by scripts/verify-db.sh after the migrations, both with and without 0007, on a
-- throwaway local database. Any failed expectation raises an exception and stops the run.
\set ON_ERROR_STOP 1
reset role;

create function pg_temp.must_fail(sql text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'expected failure but statement succeeded: %', sql;
exception when insufficient_privilege or check_violation or raise_exception or not_null_violation or unique_violation or foreign_key_violation then
  if sqlerrm like 'expected failure%' then raise; end if;
end $$;
grant execute on function pg_temp.must_fail(text) to anon, authenticated;
-- Act as a signed-in user. With migration 0007 present, the session must be fully verified (password + SMS step-up),
-- so a session and a step-up are recorded first; without 0007 the claims alone are enough.
create function pg_temp.login(uid uuid) returns void language plpgsql as $$
declare sid uuid := gen_random_uuid();
begin
  insert into auth.sessions (id, user_id) values (sid, uid);
  if to_regclass('public.sms_step_ups') is not null then
    execute 'insert into public.sms_step_ups (session_id, user_id) values ($1, $2)' using sid, uid;
  end if;
  perform set_config('request.jwt.claim.sub', uid::text, false);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated', 'session_id', sid, 'aal', 'aal1',
    'amr', json_build_array(json_build_object('method', 'password', 'timestamp', 0)))::text, false);
end $$;

-- Two new accounts (email sign-up and Google sign-up both create auth.users rows; the trigger chain is the same).
insert into auth.users (id, email, email_confirmed_at, phone, phone_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'c1@example.com', now(), '919800000101', now(), '{"full_name":"Gift One","phone":"+919800000101"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'c2@example.com', now(), '919800000102', now(), '{"full_name":"Gift Two","phone":"+919800000102"}');

do $$
declare g1 text; g2 text;
begin
  select gift_id into g1 from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  select gift_id into g2 from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c2';
  assert g1 ~ '^GIFT-[0-9A-HJKMNP-TV-Z]{8}$', format('every new account gets a GIFT ID in the GIFT-XXXXXXXX format, got %s', g1);
  assert g2 ~ '^GIFT-[0-9A-HJKMNP-TV-Z]{8}$', 'second account gets a GIFT ID';
  assert g1 <> g2, 'two accounts never share a GIFT ID';
  assert (select user_id from public.gift_id_registry where gift_id = g1) = '00000000-0000-0000-0000-0000000000c1', 'the registry ties the ID to its account';
  -- The ID carries no personal data: the generator takes no input at all, only random bytes.
  assert (select pronargs from pg_proc where proname = 'generate_gift_id' and pronamespace = 'public'::regnamespace) = 0, 'the generator has no inputs (no personal data can enter the ID)';
end $$;

-- Every account has exactly one GIFT ID; none is shared.
do $$ begin
  assert (select count(*) from auth.users) = (select count(distinct p.gift_id) from public.profiles p join auth.users u on u.id = p.user_id), 'one GIFT ID per account';
  assert not exists (select gift_id from public.profiles group by gift_id having count(*) > 1), 'no duplicate GIFT IDs';
  assert not exists (select 1 from public.profiles where gift_id is null), 'no account without a GIFT ID';
end $$;

-- Assignment is idempotent: an account that already has an ID keeps it.
do $$
declare before text; again text;
begin
  select gift_id into before from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  again := public.assign_gift_id('00000000-0000-0000-0000-0000000000c1');
  assert again = before, 'assigning again returns the same GIFT ID';
  assert (select count(*) from public.gift_id_registry where user_id = '00000000-0000-0000-0000-0000000000c1') = 1, 'still exactly one registry row';
end $$;

-- Immutable: nobody can change it, not even the database owner; a client value on insert is ignored.
select pg_temp.must_fail($q$ update public.profiles set gift_id = 'GIFT-ZZZZZZZZ' where user_id = '00000000-0000-0000-0000-0000000000c1' $q$);
select pg_temp.must_fail($q$ update public.profiles set gift_id = null where user_id = '00000000-0000-0000-0000-0000000000c1' $q$);
-- Even another account's real ID cannot be copied onto this one.
select pg_temp.must_fail($q$ update public.profiles set gift_id = (select gift_id from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c2') where user_id = '00000000-0000-0000-0000-0000000000c1' $q$);

-- Signed-in user: can read their own GIFT ID, cannot change it, cannot read or touch another account by GIFT ID.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
set role authenticated;
do $$
declare mine text; theirs text;
begin
  select gift_id into mine from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  assert mine is not null, 'a user reads their own GIFT ID';
  assert (select count(*) from public.profiles where user_id <> '00000000-0000-0000-0000-0000000000c1') = 0, 'other profiles are invisible';
end $$;
select pg_temp.must_fail($q$ update public.profiles set gift_id = 'GIFT-AAAAAAAA' where user_id = '00000000-0000-0000-0000-0000000000c1' $q$);
reset role;
-- Knowing User B's GIFT ID gives User A nothing: no profile, watchlist, research or alert of B, no update of B.
do $$
declare theirs text;
begin
  select gift_id into theirs from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c2';
  perform set_config('test.theirs', theirs, false);
end $$;
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
set role authenticated;
do $$
declare theirs text := current_setting('test.theirs'); n int;
begin
  assert (select count(*) from public.profiles where gift_id = theirs) = 0, 'A cannot find B''s profile by GIFT ID';
  assert (select count(*) from public.watchlists where user_id = '00000000-0000-0000-0000-0000000000c2') = 0, 'A cannot see B''s watchlists';
  assert (select count(*) from public.saved_research where user_id = '00000000-0000-0000-0000-0000000000c2') = 0, 'A cannot see B''s research';
  assert (select count(*) from public.alerts where user_id = '00000000-0000-0000-0000-0000000000c2') = 0, 'A cannot see B''s alerts';
  update public.profiles set full_name = 'Taken over' where gift_id = theirs;
  get diagnostics n = row_count;
  assert n = 0, 'A cannot change B''s profile by GIFT ID';
end $$;
-- The registry and the functions are not reachable by signed-in users or visitors.
select pg_temp.must_fail($q$ select * from public.gift_id_registry $q$);
select pg_temp.must_fail($q$ select public.assign_gift_id('00000000-0000-0000-0000-0000000000c1') $q$);
select pg_temp.must_fail($q$ select public.generate_gift_id() $q$);
select pg_temp.must_fail($q$ select * from public.account_by_gift_id('GIFT-AAAAAAAA') $q$);
reset role;
set role anon;
select pg_temp.must_fail($q$ select * from public.gift_id_registry $q$);
do $$ begin assert (select count(*) from public.profiles) = 0, 'visitors see no profiles'; end $$;
reset role;

-- No row-level security policy authorises by GIFT ID: ownership is auth.uid() only.
do $$ begin
  assert not exists (select 1 from pg_policies where coalesce(qual, '') ilike '%gift_id%' or coalesce(with_check, '') ilike '%gift_id%'), 'no policy uses gift_id';
end $$;

-- Collision handling: a candidate already issued is skipped and the next one is used (the generator is swapped for a
-- scripted one inside this test only).
create table public.test_gift_queue (n serial primary key, gift_id text not null);
insert into public.test_gift_queue (gift_id) select gift_id from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_gift_queue (gift_id) values ('GIFT-TESTAAAA');
alter function public.generate_gift_id() rename to generate_gift_id_real;
create function public.generate_gift_id() returns text language sql volatile set search_path = '' as $$
  delete from public.test_gift_queue where n = (select min(n) from public.test_gift_queue) returning gift_id
$$;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c3', 'c3@example.com', now(), '{"full_name":"Gift Three","phone":"+919800000103"}');
do $$ begin
  assert (select gift_id from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c3') = 'GIFT-TESTAAAA', 'a colliding candidate is retried';
end $$;
-- Bounded retries: when every candidate collides, sign-up fails safely instead of reusing an ID.
insert into public.test_gift_queue (gift_id) select gift_id from public.profiles cross join generate_series(1, 25) where user_id = '00000000-0000-0000-0000-0000000000c1';
select pg_temp.must_fail($q$ insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000c4', 'c4@example.com', now(), '{"full_name":"Gift Four","phone":"+919800000104"}') $q$);
do $$ begin assert not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000c4'), 'the failed sign-up left no account'; end $$;
drop function public.generate_gift_id();
alter function public.generate_gift_id_real() rename to generate_gift_id;
drop table public.test_gift_queue;

-- Closing an account retires its GIFT ID; it stays reserved, so it is never issued again.
do $$
declare old text;
begin
  select gift_id into old from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c2';
  delete from auth.users where id = '00000000-0000-0000-0000-0000000000c2';
  assert (select retired_at from public.gift_id_registry where gift_id = old) is not null, 'a deleted account''s GIFT ID is retired';
  assert (select user_id from public.gift_id_registry where gift_id = old) = '00000000-0000-0000-0000-0000000000c2', 'the retired ID stays reserved for that account';
  perform set_config('test.retired', old, false);
end $$;
create table public.test_gift_queue (n serial primary key, gift_id text not null);
insert into public.test_gift_queue (gift_id) values (current_setting('test.retired')), ('GIFT-TESTBBBB');
alter function public.generate_gift_id() rename to generate_gift_id_real;
create function public.generate_gift_id() returns text language sql volatile set search_path = '' as $$
  delete from public.test_gift_queue where n = (select min(n) from public.test_gift_queue) returning gift_id
$$;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c5', 'c5@example.com', now(), '{"full_name":"Gift Five","phone":"+919800000105"}');
do $$ begin
  assert (select gift_id from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c5') = 'GIFT-TESTBBBB', 'a retired GIFT ID is never reissued';
end $$;
drop function public.generate_gift_id();
alter function public.generate_gift_id_real() rename to generate_gift_id;
drop table public.test_gift_queue;

-- A profile cannot be deleted while its account exists (not by the owner, not by server code).
select pg_temp.must_fail($q$ delete from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1' $q$);
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
set role authenticated;
do $$ declare n int; begin
  delete from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  assert n = 0, 'a signed-in user cannot delete their profile (no delete policy)';
end $$;
reset role;

-- A profile created later for an existing account (missing-profile repair, e.g. legacy data with the guard bypassed)
-- gets that account's same GIFT ID back, both by a plain insert and by ensure_user_profile(), which is idempotent.
do $$
declare before text; again text;
begin
  select gift_id into before from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  alter table public.profiles disable trigger keep_profile;
  delete from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  alter table public.profiles enable trigger keep_profile;
  insert into public.profiles (user_id, full_name, gift_id) values ('00000000-0000-0000-0000-0000000000c1', 'Gift One', 'GIFT-ZZZZZZZZ');
  assert (select gift_id from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1') = before, 'a repaired profile keeps the account''s GIFT ID; a supplied value is ignored';
  alter table public.profiles disable trigger keep_profile;
  delete from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  alter table public.profiles enable trigger keep_profile;
  again := public.ensure_user_profile('00000000-0000-0000-0000-0000000000c1');
  assert again = before, 'ensure_user_profile recreates the profile with the same GIFT ID';
  assert public.ensure_user_profile('00000000-0000-0000-0000-0000000000c1') = before, 'ensure_user_profile again changes nothing';
  assert (select count(*) from public.gift_id_registry where user_id = '00000000-0000-0000-0000-0000000000c1') = 1, 'still one GIFT ID for the account';
end $$;

-- The invariant at commit: an account whose sign-up chain did not create a profile is rejected, whatever the sign-up
-- method (simulated by switching handle_new_user's trigger off for one insert).
alter table auth.users disable trigger on_auth_user_created;
-- (a) checked at the end of the statement when constraints are immediate
do $$ begin
  set constraints all immediate;
  begin
    insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000c6', 'c6@example.com', now(), '{"full_name":"No Profile","phone":"+919800000106"}');
    raise exception 'expected failure: an account without a GIFT ID was accepted';
  exception when not_null_violation then null;
  end;
end $$;
-- (b) and, by default, at commit: the standalone insert's transaction is rolled back.
\set ON_ERROR_STOP 0
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000c6', 'c6@example.com', now(), '{"full_name":"No Profile","phone":"+919800000106"}');
\set ON_ERROR_STOP 1
alter table auth.users enable trigger on_auth_user_created;
do $$ begin assert not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000c6'), 'no account exists without a GIFT ID'; end $$;
-- Social sign-ups (Google, Apple) are auth.users rows with an external identity and no password: same chain, same ID.
-- (Without 0007, as in production today, they have no phone at creation. Migration 0007 currently requires a phone in
-- the sign-up metadata of every account, social ones included; that is a known 0007 issue to fix before SMS is on, so
-- with 0007 present these test accounts carry one.)
do $$
declare phone_g text := case when to_regclass('public.account_phones') is not null then ',"phone":"+919800000107"' else '' end;
        phone_a text := case when to_regclass('public.account_phones') is not null then '"phone":"+919800000108"' else '' end;
begin
  execute format($i$insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data) values
    ('00000000-0000-0000-0000-0000000000c7', 'g7@example.com', now(), '{"full_name":"Google Person"%s}', '{"provider":"google","providers":["google"]}'),
    ('00000000-0000-0000-0000-0000000000c8', 'x8@privaterelay.appleid.com', now(), '{%s}', '{"provider":"apple","providers":["apple"]}')$i$, phone_g, phone_a);
end $$;
do $$ begin
  assert (select count(*) from public.profiles where user_id in ('00000000-0000-0000-0000-0000000000c7', '00000000-0000-0000-0000-0000000000c8') and gift_id ~ '^GIFT-[0-9A-HJKMNP-TV-Z]{8}$') = 2, 'Google and Apple accounts get a GIFT ID at creation, before any profile completion';
end $$;
-- Identity changes never touch the GIFT ID (email change, password reset, phone change, sign-in metadata).
do $$
declare before text;
begin
  select gift_id into before from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  update auth.users set email = 'c1-new@example.com', encrypted_password = 'changed', raw_user_meta_data = raw_user_meta_data || '{"country":"India"}' where id = '00000000-0000-0000-0000-0000000000c1';
  update public.profiles set full_name = 'Renamed', country = 'India' where user_id = '00000000-0000-0000-0000-0000000000c1';
  assert (select gift_id from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1') = before, 'GIFT ID unchanged by email, password and profile changes';
end $$;

-- Support lookup (service role): GIFT ID → account, case-insensitive.
do $$
declare g text;
begin
  select gift_id into g from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c1';
  assert (select user_id from public.account_by_gift_id(lower(g))) = '00000000-0000-0000-0000-0000000000c1', 'support finds the account by GIFT ID';
end $$;

\echo 'GIFT ID tests passed'
