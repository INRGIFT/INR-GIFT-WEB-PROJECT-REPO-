-- Row-level security tests. Run by scripts/verify-db.sh after all migrations, on a throwaway local database.
-- Any failed expectation raises an exception and stops the run.
\set ON_ERROR_STOP 1

-- Two users. The signup trigger must create a profile, preferences and a default watchlist for each.
-- Every account is created with a mobile number (sign-up metadata); migration 0007 reserves it.
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com', now(), '{"full_name":"User A","phone":"+919800000001"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com', now(), '{"full_name":"User B","phone":"+919800000002"}');
do $$ begin
  assert (select count(*) from public.profiles) = 2, 'signup trigger should create profiles';
  assert (select count(*) from public.user_preferences) = 2, 'signup trigger should create preferences';
  assert (select count(*) from public.watchlists) = 2, 'signup trigger should create default watchlists';
end $$;

-- Helper: run a statement as a role/user and require that it fails.
create function pg_temp.must_fail(sql text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'expected failure but statement succeeded: %', sql;
exception when insufficient_privilege or check_violation or raise_exception or not_null_violation or unique_violation then
  if sqlerrm like 'expected failure%' then raise; end if;
end $$;
grant execute on function pg_temp.must_fail(text) to anon, authenticated;
-- Helper: act as a user in a given Supabase session with given authentication methods (the JWT Supabase would issue).
create function pg_temp.as_user(uid text, sid text, amr text default '["password"]') returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid, false),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated', 'session_id', sid, 'aal', 'aal1',
           'amr', (select json_agg(json_build_object('method', m, 'timestamp', 0)) from json_array_elements_text(amr::json) m))::text, false);
$$;
grant execute on function pg_temp.as_user(text, text, text) to anon, authenticated;

-- Server side (secret key): phones confirmed after 2Factor.in matched the code, and one SMS-verified session each.
update auth.users set phone = '919800000001', phone_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000a';
update auth.users set phone = '919800000002', phone_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000b';
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b');
insert into public.sms_step_ups (session_id, user_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b');

-- ---------------------------------------------------------------- user A
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1');
do $$
declare mine uuid; theirs uuid;
begin
  assert (select count(*) from public.watchlists) = 1, 'A sees only their own watchlist';
  assert (select count(*) from public.profiles) = 1, 'A sees only their own profile';
  select id into mine from public.watchlists;
  -- Ownership is set by the database; the client never sends user_id.
  insert into public.watchlist_items (watchlist_id, instrument_id) values (mine, 'ins_000001');
  assert (select user_id from public.watchlist_items limit 1) = '00000000-0000-0000-0000-00000000000a', 'user_id defaults to auth.uid()';
  insert into public.alerts (instrument_id, kind, threshold) values ('ins_000001', 'price_above', 100);
  insert into public.notes (title) values ('Private note');
  insert into public.collections (name, instrument_ids) values ('Mine', array['ins_000001']);
  insert into public.saved_research (ref_type, ref_id, title, href) values ('asset', 'ins_000001', 'AAPL', '/stocks/AAPL');
  update public.profiles set full_name = 'A renamed', onboarded_at = now();
  assert (select full_name from public.profiles) = 'A renamed', 'A can edit their own profile';
end $$;
-- Writing rows for someone else is rejected.
select pg_temp.must_fail($q$ insert into public.watchlists (user_id, name) values ('00000000-0000-0000-0000-00000000000b', 'spoof') $q$);
select pg_temp.must_fail($q$ insert into public.notes (user_id, title) values ('00000000-0000-0000-0000-00000000000b', 'spoof') $q$);
-- Ownership can never be reassigned.
select pg_temp.must_fail($q$ update public.notes set user_id = '00000000-0000-0000-0000-00000000000b' $q$);
reset role;

-- ---------------------------------------------------------------- user B
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1');
do $$
declare a_list uuid;
begin
  assert (select count(*) from public.watchlist_items) = 0, 'B cannot read A''s watchlist items';
  assert (select count(*) from public.alerts) = 0, 'B cannot read A''s alerts';
  assert (select count(*) from public.notes) = 0, 'B cannot read A''s notes';
  assert (select count(*) from public.collections) = 0, 'B cannot read A''s collections';
  assert (select count(*) from public.saved_research) = 0, 'B cannot read A''s saved research';
  update public.notes set title = 'hijack';
  delete from public.alerts;
end $$;
reset role;
do $$ declare a_list uuid; begin
  assert (select title from public.notes) = 'Private note', 'B''s update must not touch A''s note';
  assert (select count(*) from public.alerts) = 1, 'B''s delete must not touch A''s alert';
  select id into a_list from public.watchlists where user_id = '00000000-0000-0000-0000-00000000000a';
  perform set_config('test.a_list', a_list::text, false);
end $$;
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1');
-- B cannot attach an item to A's list, even with B as the owner of the item.
select pg_temp.must_fail(format($q$ insert into public.watchlist_items (watchlist_id, instrument_id) values (%L, 'ins_000002') $q$, current_setting('test.a_list')));
reset role;

-- ---------------------------------------------------------------- anonymous
set role anon;
select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);
do $$ begin
  assert (select count(*) from public.watchlists) = 0, 'anon reads no private rows';
  assert (select count(*) from public.profiles) = 0, 'anon reads no profiles';
  assert (select count(*) from market.regions) >= 0, 'anon can read the public market schema';
  -- Contact form: anon may submit but never read back.
  insert into public.support_requests (name, email, topic, message) values ('Anon', 'x@example.com', 'data', 'A question about data');
  assert (select count(*) from public.support_requests) = 0, 'support requests are not readable';
end $$;
select pg_temp.must_fail($q$ insert into public.watchlists (name) values ('anon list') $q$);
select pg_temp.must_fail($q$ insert into market.regions (id, name) values ('x', 'x') $q$);
select pg_temp.must_fail($q$ select * from market.data_quarantine $q$);
reset role;

do $$ begin
  assert (select count(*) from public.support_requests) = 1, 'the anon submission was stored';
  assert not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone_verified'), 'profiles.phone_verified is removed';
end $$;

-- ================================================================ required credentials + SMS (migration 0007)
-- Sign-up: a mobile number is required and unique.
do $$ begin
  assert (select count(*) from public.account_phones) = 2, 'sign-up reserves each account''s number';
  assert (select phone from public.account_phones where user_id = '00000000-0000-0000-0000-00000000000a') = '919800000001', 'stored as E.164 digits';
end $$;
select pg_temp.must_fail($q$ insert into auth.users (email, raw_user_meta_data) values ('nophone@example.com', '{"full_name":"No phone"}') $q$);
select pg_temp.must_fail($q$ insert into auth.users (email, raw_user_meta_data) values ('badphone@example.com', '{"phone":"12345"}') $q$);
select pg_temp.must_fail($q$ insert into auth.users (email, raw_user_meta_data) values ('dup@example.com', '{"phone":"+91 98000 00001"}') $q$);
do $$ begin assert (select count(*) from auth.users where email in ('nophone@example.com', 'badphone@example.com', 'dup@example.com')) = 0, 'rejected sign-ups create no account'; end $$;

-- An abandoned sign-up (email never confirmed within 24 hours) does not keep the number.
insert into auth.users (id, email, created_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000c', 'stale@example.com', now() - interval '2 days', '{"phone":"+919800000003"}');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000d', 'fresh@example.com', '{"phone":"+919800000003"}');
do $$ begin assert (select user_id from public.account_phones where phone = '919800000003') = '00000000-0000-0000-0000-00000000000d', 'abandoned reservation released'; end $$;

-- Workspace rows need: password session + confirmed email and phone + an SMS step-up for this very session.
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a2');
do $$ begin assert (select count(*) from public.watchlists) = 0, 'email + password without the SMS code (this session) reads nothing'; end $$;
select pg_temp.must_fail($q$ insert into public.notes (title) values ('no sms note') $q$);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000b1');
do $$ begin assert (select count(*) from public.watchlists) = 0, 'another account''s SMS step-up does not count'; end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', '["otp"]');
do $$ begin assert (select count(*) from public.watchlists) = 0, 'a link or recovery session (no password) reads nothing, even after SMS'; end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'not-a-uuid');
do $$ begin assert (select count(*) from public.watchlists) = 0, 'a malformed session id reads nothing'; end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from public.watchlists) = 1, 'email + password + SMS for this session reads own rows';
  assert (select count(*) from public.sms_step_ups) = 1, 'a user reads only their own step-ups';
end $$;
insert into public.notes (title) values ('verified note');
-- Clients can never write verification state, read challenges or the reservation table.
select pg_temp.must_fail($q$ insert into public.sms_step_ups (session_id, user_id) values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a') $q$);
select pg_temp.must_fail($q$ select * from public.sms_challenges $q$);
select pg_temp.must_fail($q$ select * from public.account_phones $q$);
reset role;

-- An unconfirmed phone blocks even a session with a step-up.
update auth.users set phone_confirmed_at = null where id = '00000000-0000-0000-0000-00000000000b';
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1');
do $$ begin assert (select count(*) from public.watchlists) = 0, 'unconfirmed phone reads nothing'; end $$;
reset role;
update auth.users set phone_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000b';

-- Signing out deletes the session and its step-up.
delete from auth.sessions where id = '00000000-0000-0000-0000-0000000000a1';
do $$ begin assert not exists (select 1 from public.sms_step_ups where session_id = '00000000-0000-0000-0000-0000000000a1'), 'step-up removed with the session'; end $$;

-- Phone availability: another account's number is taken; your own counts as free.
set role anon;
select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);
do $$ begin
  assert public.phone_available('+919800000002') = false, 'anon: B''s number is taken';
  assert public.phone_available('+919800000099') = true, 'anon: an unused number is free';
  assert public.phone_available('123') = false, 'an invalid number is never available';
end $$;
reset role;
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1');
do $$ begin assert public.phone_available('+919800000002') = true, 'B''s own number is free for B'; end $$;
reset role;

-- Server-only availability check for a given account; clients cannot call it.
do $$ begin
  assert public.phone_available_for('+919800000002', '00000000-0000-0000-0000-00000000000b') = true, 'own number is free for its owner';
  assert public.phone_available_for('+919800000002', '00000000-0000-0000-0000-00000000000a') = false, 'another account''s number is taken';
end $$;
set role authenticated;
select pg_temp.must_fail($q$ select public.phone_available_for('+919800000002', '00000000-0000-0000-0000-00000000000b') $q$);
reset role;

-- Server-confirmed numbers: another account's number is refused; a verified change moves the reservation.
select pg_temp.must_fail($q$ update auth.users set phone = '919800000002', phone_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000a' $q$);
update auth.users set phone = '919800000009', phone_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select phone from public.account_phones where user_id = '00000000-0000-0000-0000-00000000000a') = '919800000009', 'a verified change moves the reservation';
  assert public.phone_available('+919800000001') = true, 'the old number is released';
end $$;
-- Supabase MFA factors are not used; none can be enrolled.
select pg_temp.must_fail($q$ insert into auth.mfa_factors (user_id, factor_type) values ('00000000-0000-0000-0000-00000000000a', 'totp') $q$);
select pg_temp.must_fail($q$ insert into auth.mfa_factors (user_id, factor_type, phone) values ('00000000-0000-0000-0000-00000000000a', 'phone', '919800000009') $q$);
\echo 'RLS tests passed'
