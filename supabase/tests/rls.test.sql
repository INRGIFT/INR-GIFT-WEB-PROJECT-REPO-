-- Row-level security tests. Run by scripts/verify-db.sh after all migrations, on a throwaway local database.
-- Any failed expectation raises an exception and stops the run.
\set ON_ERROR_STOP 1

-- Two users. The signup trigger must create a profile, preferences and a default watchlist for each.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com', '{"full_name":"User A"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com', '{"full_name":"User B"}');
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
exception when insufficient_privilege or check_violation or raise_exception or not_null_violation then
  if sqlerrm like 'expected failure%' then raise; end if;
end $$;
grant execute on function pg_temp.must_fail(text) to anon, authenticated;

-- ---------------------------------------------------------------- user A
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
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
-- Verification flags are server-owned: a user cannot mark their own phone as verified.
select pg_temp.must_fail($q$ update public.profiles set phone_verified = true $q$);
reset role;

-- ---------------------------------------------------------------- user B
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
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
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
-- B cannot attach an item to A's list, even with B as the owner of the item.
select pg_temp.must_fail(format($q$ insert into public.watchlist_items (watchlist_id, instrument_id) values (%L, 'ins_000002') $q$, current_setting('test.a_list')));
reset role;

-- ---------------------------------------------------------------- anonymous
set role anon;
select set_config('request.jwt.claim.sub', '', false);
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

-- Server-owned phone verification follows auth.users.
update auth.users set phone = '+919800000000', phone_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select phone_verified from public.profiles where user_id = '00000000-0000-0000-0000-00000000000a'), 'phone_verified mirrors auth.users.phone_confirmed_at';
  assert (select count(*) from public.support_requests) = 1, 'the anon submission was stored';
end $$;
\echo 'RLS tests passed'
