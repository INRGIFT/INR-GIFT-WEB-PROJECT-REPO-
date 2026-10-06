-- Fixes from the Supabase security and performance advisors (first run against the hosted project, 2026-10-06).
-- No behaviour change: the same owner-only rules, evaluated once per statement instead of once per row.

-- Security: pin search_path on every function; signup trigger is not callable through the API.
alter function public.lock_user_id() set search_path = public;
alter function public.guard_profile_verification() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Performance: `(select auth.uid())` is evaluated once per query (initplan), not per row.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'user_preferences', 'watchlists', 'alerts', 'saved_screens', 'saved_comparisons', 'saved_research', 'notes', 'recent_history', 'notifications', 'collections']
  loop
    execute format('alter policy "owner reads" on public.%I to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('alter policy "owner inserts" on public.%I to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('alter policy "owner updates" on public.%I to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('alter policy "owner deletes" on public.%I to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

alter policy "owner reads" on public.watchlist_items to authenticated using ((select auth.uid()) = user_id);
alter policy "owner deletes" on public.watchlist_items to authenticated using ((select auth.uid()) = user_id);
alter policy "owner inserts into own list" on public.watchlist_items to authenticated
  with check ((select auth.uid()) = user_id and exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));
alter policy "owner updates within own list" on public.watchlist_items to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));
alter policy "anyone submits" on public.support_requests with check (user_id is null or user_id = (select auth.uid()));

-- Performance: cover foreign keys used by lookups and cascades.
create index if not exists watchlists_user_id_idx on public.watchlists (user_id);
create index if not exists notes_user_id_idx on public.notes (user_id, updated_at desc);
create index if not exists saved_screens_user_id_idx on public.saved_screens (user_id);
create index if not exists saved_comparisons_user_id_idx on public.saved_comparisons (user_id);
create index if not exists support_requests_user_id_idx on public.support_requests (user_id);
create index if not exists instruments_issuer_id_idx on market.instruments (issuer_id);
create index if not exists instruments_underlying_idx on market.instruments (underlying_instrument_id);
create index if not exists exchanges_country_idx on market.exchanges (country_code);
create index if not exists countries_region_idx on market.countries (region_id);
create index if not exists issuers_country_idx on market.issuers (country_code);
create index if not exists dividends_instrument_idx on market.dividends (instrument_id, ex_date desc);
create index if not exists corporate_actions_instrument_idx on market.corporate_actions (instrument_id, action_date desc);
create index if not exists calendar_events_instrument_idx on market.calendar_events (instrument_id);
create index if not exists news_assets_instrument_idx on market.news_assets (instrument_id);
create index if not exists research_assets_instrument_idx on market.research_assets (instrument_id);
create index if not exists theme_assets_instrument_idx on market.theme_assets (instrument_id);
create index if not exists etf_holdings_holding_idx on market.etf_holdings (holding_instrument_id);
create index if not exists market_prices_source_idx on market.market_prices (source_id);
create index if not exists ohlcv_source_idx on market.ohlcv (source_id);
create index if not exists fundamentals_source_idx on market.fundamentals (source_id);
create index if not exists news_articles_source_idx on market.news_articles (source_id);
create index if not exists data_entitlements_source_idx on market.data_entitlements (source_id);
create index if not exists data_entitlements_mic_idx on market.data_entitlements (mic);
