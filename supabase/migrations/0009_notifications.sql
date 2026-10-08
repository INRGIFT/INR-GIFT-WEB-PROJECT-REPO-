-- Notifications: one outbox for every INRGIFT account email outside the Supabase Auth hook, written by the database in
-- the same transaction as the action it reports. If the action rolls back, so does its notification: no success email
-- is ever sent for something that did not happen. The server dispatcher (src/services/notifications) sends pending
-- rows through Resend, once each (atomic claim + Resend idempotency key = event id), honouring preferences.
--
-- Requires migration 0008 (GIFT ID). Independent of 0007 (SMS). Apply on its own after 0008.
--
-- Stored per event: type, category, whether it is mandatory, an idempotency key, a payload of identifiers and names
-- (never passwords, codes, tokens or secrets), status, attempts, the provider message id and delivery state.
-- Only the service role and security-definer functions touch it; users see their own in-app notifications instead.

do $$ begin
  if to_regclass('public.gift_id_registry') is null then raise exception 'Apply migration 0008 (GIFT ID) before 0009'; end if;
end $$;

-- 1. Outbox and delivery log.
create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type ~ '^[A-Z][A-Z_]{2,40}$'),
  category text not null check (category in ('security', 'account', 'support', 'watchlist', 'alerts', 'research')),
  mandatory boolean not null default false,
  idempotency_key text not null unique check (char_length(idempotency_key) <= 200),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped', 'digest')),
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  claimed_at timestamptz,
  failure_reason text check (char_length(failure_reason) <= 60),
  provider text not null default 'resend',
  provider_message_id text,
  delivery_status text check (delivery_status in ('delivered', 'bounced', 'complained', 'delayed')),
  recipient text,
  digest_id uuid,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.notification_events is 'Notification outbox and delivery log. Service role only; no client access.';
create index notification_events_due on public.notification_events (status, next_attempt_at);
create index notification_events_user on public.notification_events (user_id, created_at desc);
create index notification_events_provider on public.notification_events (provider_message_id) where provider_message_id is not null;
alter table public.notification_events enable row level security;
alter table public.notification_events force row level security;
revoke all on public.notification_events from public, anon, authenticated;

-- 2. Email preferences (the existing notify_email is the "product activity" switch; security and account emails are
--    always sent and are not stored as preferences).
alter table public.user_preferences
  add column notify_watchlist boolean not null default true,
  add column notify_alerts boolean not null default true,
  add column notify_research boolean not null default true,
  add column notify_marketing boolean not null default false,
  add column email_digest text not null default 'immediate' check (email_digest in ('immediate', 'hourly', 'daily', 'off'));

-- 3. Enqueue: the event once per idempotency key, plus an in-app notification when a title is given.
create or replace function public.enqueue_notification(p_user uuid, p_type text, p_category text, p_mandatory boolean, p_key text,
  p_payload jsonb default '{}'::jsonb, p_in_app_title text default null, p_in_app_body text default null, p_href text default null,
  p_in_app_category text default 'account') returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v uuid;
begin
  -- An account being deleted (cascades in progress) gets no notifications.
  if not exists (select 1 from auth.users u where u.id = p_user) then return null; end if;
  insert into public.notification_events (user_id, event_type, category, mandatory, idempotency_key, payload)
  values (p_user, p_type, p_category, p_mandatory, p_key, coalesce(p_payload, '{}'::jsonb))
  on conflict (idempotency_key) do nothing returning id into v;
  if v is not null and p_in_app_title is not null then
    insert into public.notifications (user_id, category, title, body, href, ref_id) values (p_user, p_in_app_category, p_in_app_title, coalesce(p_in_app_body, ''), p_href, v::text);
  end if;
  return v;
end $$;

-- 4. Claim due events for sending, atomically (two dispatchers never take the same row). Rows stuck in "sending" for
--    10 minutes (a crashed sender) return to the queue; Resend's idempotency key prevents a second delivery.
create or replace function public.claim_notifications(p_user uuid, p_limit int) returns setof public.notification_events
language plpgsql volatile security definer set search_path = '' as $$
begin
  update public.notification_events set status = 'pending' where status = 'sending' and claimed_at < now() - interval '10 minutes';
  return query
  update public.notification_events e set status = 'sending', attempts = e.attempts + 1, claimed_at = now()
  where e.id in (
    select n.id from public.notification_events n
    where n.status = 'pending' and n.next_attempt_at <= now() and (p_user is null or n.user_id = p_user)
    order by n.created_at limit greatest(1, least(p_limit, 100)) for update skip locked)
  returning e.*;
end $$;
-- Digest rows of one account that are due, claimed the same way.
create or replace function public.claim_digest(p_user uuid) returns setof public.notification_events
language plpgsql volatile security definer set search_path = '' as $$
begin
  return query
  update public.notification_events e set status = 'sending', claimed_at = now()
  where e.id in (select n.id from public.notification_events n where n.status = 'digest' and n.user_id = p_user order by n.created_at limit 200 for update skip locked)
  returning e.*;
end $$;

-- 5. Product events, from the tables the workspace writes (RLS-owned rows; the trigger runs after the write succeeds,
--    inside its transaction). Rows created by another trigger (the starter watchlist made at sign-up) are not reported.
create or replace function public.notify_workspace_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  r record := case when tg_op = 'DELETE' then old else new end;
  t text; cat text; payload jsonb := '{}'::jsonb; key text; changed text[] := '{}';
begin
  if pg_trigger_depth() > 1 then return null; end if;
  if tg_table_name = 'watchlists' then
    cat := 'watchlist';
    t := case tg_op when 'INSERT' then 'WATCHLIST_CREATED' when 'DELETE' then 'WATCHLIST_DELETED' else 'WATCHLIST_UPDATED' end;
    if tg_op = 'UPDATE' then
      if new.name is not distinct from old.name then return null; end if;
      payload := jsonb_build_object('watchlist_id', new.id, 'name', new.name, 'previous_name', old.name);
    else payload := jsonb_build_object('watchlist_id', r.id, 'name', r.name); end if;
  elsif tg_table_name = 'watchlist_items' then
    if tg_op = 'UPDATE' then return null; end if;
    -- An item removed because its whole watchlist was deleted is covered by WATCHLIST_DELETED.
    if tg_op = 'DELETE' and not exists (select 1 from public.watchlists w where w.id = old.watchlist_id) then return null; end if;
    cat := 'watchlist';
    t := case tg_op when 'INSERT' then 'WATCHLIST_ITEM_ADDED' else 'WATCHLIST_ITEM_REMOVED' end;
    payload := jsonb_build_object('watchlist_id', r.watchlist_id, 'instrument_id', r.instrument_id,
      'watchlist_name', (select w.name from public.watchlists w where w.id = r.watchlist_id));
  elsif tg_table_name = 'alerts' then
    cat := 'alerts';
    if tg_op = 'UPDATE' then
      if new.last_triggered_at is distinct from old.last_triggered_at and new.last_triggered_at is not null then
        -- Triggered: email only when the alert asks for an email copy (the browser already wrote the in-app notice).
        if new.channel = 'email' then
          perform public.enqueue_notification(new.user_id, 'ALERT_TRIGGERED', 'alerts', false,
            'ALERT_TRIGGERED:' || new.id || ':' || new.last_triggered_at,
            jsonb_build_object('alert_id', new.id, 'instrument_id', new.instrument_id, 'kind', new.kind, 'threshold', new.threshold, 'triggered_at', new.last_triggered_at));
        end if;
      end if;
      if new.kind is distinct from old.kind then changed := changed || 'condition'::text; end if;
      if new.threshold is distinct from old.threshold then changed := changed || 'threshold'::text; end if;
      if new.channel is distinct from old.channel then changed := changed || 'delivery'::text; end if;
      if new.note is distinct from old.note then changed := changed || 'note'::text; end if;
      if new.status is distinct from old.status and not (old.status = 'active' and new.status = 'triggered') then changed := changed || 'status'::text; end if;
      if cardinality(changed) = 0 then return null; end if;
      t := 'ALERT_UPDATED';
      payload := jsonb_build_object('alert_id', new.id, 'instrument_id', new.instrument_id, 'kind', new.kind, 'threshold', new.threshold, 'status', new.status, 'channel', new.channel, 'changed', to_jsonb(changed));
    else
      t := case tg_op when 'INSERT' then 'ALERT_CREATED' else 'ALERT_DELETED' end;
      payload := jsonb_build_object('alert_id', r.id, 'instrument_id', r.instrument_id, 'kind', r.kind, 'threshold', r.threshold, 'status', r.status, 'channel', r.channel);
    end if;
  elsif tg_table_name = 'saved_research' then
    if tg_op = 'UPDATE' then return null; end if;
    cat := 'research';
    t := case tg_op when 'INSERT' then 'RESEARCH_SAVED' else 'RESEARCH_REMOVED' end;
    payload := jsonb_build_object('saved_id', r.id, 'title', r.title, 'href', r.href, 'ref_type', r.ref_type, 'ref_id', r.ref_id);
  elsif tg_table_name = 'saved_screens' then
    if tg_op <> 'INSERT' then return null; end if;
    cat := 'research'; t := 'SCREEN_SAVED';
    payload := jsonb_build_object('screen_id', r.id, 'name', r.name);
  elsif tg_table_name = 'saved_comparisons' then
    if tg_op <> 'INSERT' then return null; end if;
    cat := 'research'; t := 'COMPARISON_SAVED';
    payload := jsonb_build_object('comparison_id', r.id, 'name', r.name, 'instrument_ids', to_jsonb(r.instrument_ids));
  else
    return null;
  end if;
  if t is null then return null; end if;
  -- One event per row and transaction: a repeated request is a new action, a retried transaction is not.
  key := t || ':' || r.id || ':' || txid_current();
  perform public.enqueue_notification(r.user_id, t, cat, false, key, payload);
  return null;
end $$;
create trigger notify_change after insert or update or delete on public.watchlists for each row execute function public.notify_workspace_change();
create trigger notify_change after insert or delete on public.watchlist_items for each row execute function public.notify_workspace_change();
create trigger notify_change after insert or update or delete on public.alerts for each row execute function public.notify_workspace_change();
create trigger notify_change after insert or delete on public.saved_research for each row execute function public.notify_workspace_change();
create trigger notify_change after insert on public.saved_screens for each row execute function public.notify_workspace_change();
create trigger notify_change after insert on public.saved_comparisons for each row execute function public.notify_workspace_change();

-- 6. Profile changes the person makes (name, country): what changed, never the values of other fields.
create or replace function public.notify_profile_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare changed text[] := '{}';
begin
  if pg_trigger_depth() > 1 then return null; end if;
  if new.full_name is distinct from old.full_name then changed := changed || 'name'::text; end if;
  if new.country is distinct from old.country then changed := changed || 'country'::text; end if;
  if cardinality(changed) = 0 then return null; end if;
  perform public.enqueue_notification(new.user_id, 'PROFILE_UPDATED', 'account', true,
    'PROFILE_UPDATED:' || new.user_id || ':' || txid_current(), jsonb_build_object('changed', to_jsonb(changed)),
    'Your profile was updated', 'Changed: ' || array_to_string(changed, ', ') || '.', '/account/profile', 'account');
  return null;
end $$;
create trigger notify_profile_change after update of full_name, country on public.profiles for each row execute function public.notify_profile_change();

-- 7. Welcome, once, when the account's email address is first confirmed (the six-digit code, or a Google/Apple account,
--    whose provider confirms the address at creation). The GIFT ID email goes once per issued ID.
create or replace function public.notify_email_confirmed() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is null or (tg_op = 'UPDATE' and old.email_confirmed_at is not null) then return null; end if;
  perform public.enqueue_notification(new.id, 'USER_WELCOME', 'account', true, 'USER_WELCOME:' || new.id, '{}'::jsonb,
    'Welcome to INRGIFT', 'Your email address is verified.', '/app', 'system');
  return null;
end $$;
create trigger notify_email_confirmed after insert or update of email_confirmed_at on auth.users for each row execute function public.notify_email_confirmed();

create or replace function public.notify_gift_id() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.enqueue_notification(new.user_id, 'GIFT_ID_ASSIGNED', 'account', true, 'GIFT_ID_ASSIGNED:' || new.user_id,
    jsonb_build_object('gift_id', new.gift_id), 'Your GIFT ID', 'Your permanent INRGIFT account reference is ' || new.gift_id || '.', '/account/profile', 'account');
  return null;
end $$;
create trigger notify_gift_id after insert on public.gift_id_registry for each row execute function public.notify_gift_id();
-- Accounts whose GIFT ID was issued before this migration (the 0008 backfill) receive it once too.
select public.enqueue_notification(r.user_id, 'GIFT_ID_ASSIGNED', 'account', true, 'GIFT_ID_ASSIGNED:' || r.user_id,
  jsonb_build_object('gift_id', r.gift_id), 'Your GIFT ID', 'Your permanent INRGIFT account reference is ' || r.gift_id || '.', '/account/profile', 'account')
from public.gift_id_registry r join auth.users u on u.id = r.user_id where r.retired_at is null;

-- 8. Nothing here is callable by visitors or signed-in users; the server uses the service role.
revoke execute on function public.enqueue_notification(uuid, text, text, boolean, text, jsonb, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.claim_notifications(uuid, int) from public, anon, authenticated;
revoke execute on function public.claim_digest(uuid) from public, anon, authenticated;
revoke execute on function public.notify_workspace_change() from public, anon, authenticated;
revoke execute on function public.notify_profile_change() from public, anon, authenticated;
revoke execute on function public.notify_email_confirmed() from public, anon, authenticated;
revoke execute on function public.notify_gift_id() from public, anon, authenticated;
grant execute on function public.enqueue_notification(uuid, text, text, boolean, text, jsonb, text, text, text, text) to service_role;
grant execute on function public.claim_notifications(uuid, int) to service_role;
grant execute on function public.claim_digest(uuid) to service_role;
