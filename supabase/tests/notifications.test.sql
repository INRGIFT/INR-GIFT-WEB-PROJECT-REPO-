-- Notification outbox tests (migration 0009). Run by scripts/verify-db.sh on a throwaway database, with and without 0007.
\set ON_ERROR_STOP 1
reset role;

create function pg_temp.must_fail(sql text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'expected failure but statement succeeded: %', sql;
exception when insufficient_privilege or check_violation or raise_exception or undefined_function then
  if sqlerrm like 'expected failure%' then raise; end if;
end $$;
grant execute on function pg_temp.must_fail(text) to anon, authenticated;
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
create function pg_temp.events(uid uuid, t text) returns bigint language sql as $$ select count(*) from public.notification_events where user_id = uid and event_type = t $$;

-- Accounts: n1 signs up with the email already confirmed (as Google/Apple do), n2 confirms with the code later.
insert into auth.users (id, email, email_confirmed_at, phone, phone_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'n1@example.com', now(), '919800000201', now(), '{"full_name":"Note One","phone":"+919800000201"}');
insert into auth.users (id, email, phone, phone_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f2', 'n2@example.com', '919800000202', now(), '{"full_name":"Note Two","phone":"+919800000202"}');
do $$ begin
  assert pg_temp.events('00000000-0000-0000-0000-0000000000f1', 'USER_WELCOME') = 1, 'a confirmed new account gets one welcome';
  assert pg_temp.events('00000000-0000-0000-0000-0000000000f2', 'USER_WELCOME') = 0, 'no welcome before the email is confirmed';
  assert pg_temp.events('00000000-0000-0000-0000-0000000000f1', 'GIFT_ID_ASSIGNED') = 1, 'the GIFT ID email is queued once at assignment';
  assert (select payload ->> 'gift_id' from public.notification_events where user_id = '00000000-0000-0000-0000-0000000000f1' and event_type = 'GIFT_ID_ASSIGNED')
    = (select gift_id from public.profiles where user_id = '00000000-0000-0000-0000-0000000000f1'), 'the queued GIFT ID is the account''s real one';
  assert pg_temp.events('00000000-0000-0000-0000-0000000000f1', 'WATCHLIST_CREATED') = 0, 'the starter watchlist made at sign-up is not reported';
end $$;
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-0000000000f2';
update auth.users set email_confirmed_at = now() + interval '1 minute' where id = '00000000-0000-0000-0000-0000000000f2';
do $$ begin assert pg_temp.events('00000000-0000-0000-0000-0000000000f2', 'USER_WELCOME') = 1, 'confirming sends one welcome, never a second'; end $$;

-- Workspace actions by the signed-in owner (RLS as in production).
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
set role authenticated;
insert into public.watchlists (name) values ('Global Technology');
update public.watchlists set name = 'Global Tech' where name = 'Global Technology';
update public.watchlists set name = 'Global Tech' where name = 'Global Tech';
insert into public.watchlist_items (watchlist_id, instrument_id) select id, 'AAPL' from public.watchlists where name = 'Global Tech';
delete from public.watchlist_items where instrument_id = 'AAPL';
insert into public.watchlist_items (watchlist_id, instrument_id) select id, 'MSFT' from public.watchlists where name = 'Global Tech';
delete from public.watchlists where name = 'Global Tech';
-- A rolled-back action leaves no notification.
begin;
insert into public.watchlists (name) values ('Never saved');
rollback;
insert into public.alerts (instrument_id, kind, threshold, channel) values ('AAPL', 'price_above', 250, 'in_app');
update public.alerts set threshold = 260 where instrument_id = 'AAPL';
update public.alerts set last_triggered_at = '2026-10-08T10:00:00Z', status = 'triggered' where instrument_id = 'AAPL';
update public.alerts set channel = 'email', last_triggered_at = '2026-10-08T11:00:00Z' where instrument_id = 'AAPL';
update public.alerts set last_triggered_at = '2026-10-08T11:00:00Z' where instrument_id = 'AAPL';
delete from public.alerts where instrument_id = 'AAPL';
insert into public.saved_research (ref_type, ref_id, title, href) values ('asset', 'RELIANCE', 'Reliance Industries', '/stocks/RELIANCE');
delete from public.saved_research where ref_id = 'RELIANCE';
insert into public.saved_screens (name, definition) values ('Large caps', '{}');
insert into public.saved_comparisons (name, instrument_ids) values ('Tech', array['AAPL', 'MSFT']);
update public.profiles set full_name = 'Note One Renamed' where user_id = '00000000-0000-0000-0000-0000000000f1';
update public.profiles set onboarded_at = now() where user_id = '00000000-0000-0000-0000-0000000000f1';
reset role;

do $$
declare u uuid := '00000000-0000-0000-0000-0000000000f1';
begin
  assert pg_temp.events(u, 'WATCHLIST_CREATED') = 1, 'one watchlist created (the rolled-back one is absent)';
  assert not exists (select 1 from public.notification_events where payload ->> 'name' = 'Never saved'), 'a rolled-back action is never notified';
  assert pg_temp.events(u, 'WATCHLIST_UPDATED') = 1, 'a rename is reported; an update that changes nothing is not';
  assert (select payload ->> 'previous_name' from public.notification_events where user_id = u and event_type = 'WATCHLIST_UPDATED') = 'Global Technology', 'the update carries the real change';
  assert pg_temp.events(u, 'WATCHLIST_ITEM_ADDED') = 2, 'each added item is reported';
  assert (select payload ->> 'watchlist_name' from public.notification_events where user_id = u and event_type = 'WATCHLIST_ITEM_ADDED' limit 1) = 'Global Tech', 'with the watchlist it was added to';
  assert pg_temp.events(u, 'WATCHLIST_ITEM_REMOVED') = 1, 'a removed item is reported; items removed with their watchlist are not';
  assert pg_temp.events(u, 'WATCHLIST_DELETED') = 1, 'the deleted watchlist is reported';
  assert pg_temp.events(u, 'ALERT_CREATED') = 1, 'alert created';
  assert pg_temp.events(u, 'ALERT_UPDATED') = 2, 'threshold change and delivery change are updates; a trigger alone is not';
  assert (select payload -> 'changed' from public.notification_events where user_id = u and event_type = 'ALERT_UPDATED' order by created_at, id limit 1) ? 'threshold', 'only the fields that changed are listed';
  assert pg_temp.events(u, 'ALERT_TRIGGERED') = 1, 'triggered: emailed only with an email copy, and once per trigger time';
  assert pg_temp.events(u, 'ALERT_DELETED') = 1, 'alert deleted';
  assert pg_temp.events(u, 'RESEARCH_SAVED') = 1 and pg_temp.events(u, 'RESEARCH_REMOVED') = 1, 'research saved and removed';
  assert pg_temp.events(u, 'SCREEN_SAVED') = 1 and pg_temp.events(u, 'COMPARISON_SAVED') = 1, 'screen and comparison saved';
  assert pg_temp.events(u, 'PROFILE_UPDATED') = 1, 'a name change is reported; onboarding is not a profile change';
  assert (select payload -> 'changed' from public.notification_events where user_id = u and event_type = 'PROFILE_UPDATED') = '["name"]'::jsonb, 'only the changed field';
  assert exists (select 1 from public.notifications where user_id = u and title = 'Your profile was updated'), 'account events also appear in the in-app notification centre';
  assert not exists (select 1 from public.notification_events where payload::text ~* '(password|token|secret|otp)'), 'no credentials in payloads';
end $$;

-- Idempotency: the same key never makes a second event.
do $$
declare a uuid; b uuid;
begin
  a := public.enqueue_notification('00000000-0000-0000-0000-0000000000f1', 'PASSWORD_CHANGED', 'security', true, 'PASSWORD_CHANGED:test-1', '{}');
  b := public.enqueue_notification('00000000-0000-0000-0000-0000000000f1', 'PASSWORD_CHANGED', 'security', true, 'PASSWORD_CHANGED:test-1', '{}');
  assert a is not null and b is null, 'a repeated key is ignored';
  assert pg_temp.events('00000000-0000-0000-0000-0000000000f1', 'PASSWORD_CHANGED') = 1, 'one event per key';
end $$;

-- Claiming is atomic: a row claimed once is not handed out again.
do $$
declare first int; second int;
begin
  select count(*) into first from public.claim_notifications('00000000-0000-0000-0000-0000000000f1', 100);
  select count(*) into second from public.claim_notifications('00000000-0000-0000-0000-0000000000f1', 100);
  assert first > 0 and second = 0, format('claim once (first %s, second %s)', first, second);
  assert not exists (select 1 from public.notification_events where user_id = '00000000-0000-0000-0000-0000000000f1' and status = 'sending' and attempts <> 1), 'one attempt counted';
end $$;

-- Ownership: users never see the outbox or call its functions; in-app notifications stay per account.
select pg_temp.login('00000000-0000-0000-0000-0000000000f2');
set role authenticated;
select pg_temp.must_fail($q$ select * from public.notification_events $q$);
select pg_temp.must_fail($q$ select public.enqueue_notification('00000000-0000-0000-0000-0000000000f2', 'PASSWORD_CHANGED', 'security', true, 'x', '{}') $q$);
select pg_temp.must_fail($q$ select * from public.claim_notifications(null, 10) $q$);
do $$ begin
  assert (select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-0000000000f1') = 0, 'another account''s notifications are invisible';
  update public.user_preferences set notify_watchlist = false, email_digest = 'daily' where user_id = '00000000-0000-0000-0000-0000000000f2';
  assert (select email_digest from public.user_preferences where user_id = '00000000-0000-0000-0000-0000000000f2') = 'daily', 'a user sets their own email preferences';
  update public.user_preferences set email_digest = 'hourly' where user_id = '00000000-0000-0000-0000-0000000000f1';
end $$;
reset role;
do $$ begin assert (select email_digest from public.user_preferences where user_id = '00000000-0000-0000-0000-0000000000f1') = 'immediate', 'nobody changes another account''s preferences'; end $$;

-- Deleting an account with queued notifications works (cascade), and nothing is queued for the deleted account.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000f2';
do $$ begin assert not exists (select 1 from public.notification_events where user_id = '00000000-0000-0000-0000-0000000000f2'), 'events go with the account'; end $$;

\echo 'notification tests passed'
