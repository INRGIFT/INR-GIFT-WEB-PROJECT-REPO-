-- INRGIFT normalized market-data model. Separate schema from user-private tables.
-- Identity: issuer → instrument (security / share class) → listing (exchange MIC + provider symbol).
-- `instruments.id` is the immutable internal instrument_id; tickers live on listings and may change.
-- Readable by anyone (subject to data_entitlements); writable only by the service role used by ingestion.

create schema if not exists market;

create table market.regions (id text primary key, name text not null);
create table market.countries (code char(2) primary key, name text not null, region_id text not null references market.regions (id), currency char(3) not null);
create table market.exchanges (
  mic char(4) primary key, name text not null, country_code char(2) not null references market.countries (code), timezone text not null,
  regular_open time not null, regular_close time not null, break_start time, break_end time, pre_open time, post_close time,
  auction_open time, auction_close time, trading_days smallint[] not null default '{1,2,3,4,5}'
);
create table market.market_holidays (mic char(4) not null references market.exchanges (mic), day date not null, name text not null, early_close time, primary key (mic, day));
create table market.data_sources (id text primary key, name text not null, kind text not null check (kind in ('primary', 'secondary', 'demo')), priority int not null default 0);
create table market.issuers (id text primary key, name text not null, country_code char(2) references market.countries (code), sector text, industry text, website text);
create table market.instruments (
  id text primary key check (id ~ '^ins_[0-9]{6}$'),
  issuer_id text references market.issuers (id),
  asset_class text not null check (asset_class in ('stock', 'etf', 'index', 'fx', 'commodity', 'bond', 'reit', 'fund')),
  name text not null, share_class text, isin text, currency char(3) not null, is_depositary_receipt boolean not null default false,
  underlying_instrument_id text references market.instruments (id),
  active boolean not null default true, created_at timestamptz not null default now()
);
create table market.listings (
  id bigserial primary key, instrument_id text not null references market.instruments (id), mic char(4) not null references market.exchanges (mic),
  ticker text not null, slug text not null, is_primary boolean not null default false,
  source_id text references market.data_sources (id), provider_symbol text,
  listed_on date, delisted_on date, unique (mic, ticker), unique (source_id, provider_symbol)
);
create index on market.listings (instrument_id);
create index on market.listings (slug);

create table market.market_prices (
  instrument_id text primary key references market.instruments (id), price numeric, prev_close numeric, volume numeric, currency char(3) not null,
  status text not null check (status in ('LIVE', 'DELAYED', 'END_OF_DAY', 'CLOSED', 'UNAVAILABLE', 'STALE', 'ERROR')),
  source_id text not null references market.data_sources (id), as_of timestamptz not null, timezone text not null, ingested_at timestamptz not null default now()
);
create table market.ohlcv (
  instrument_id text not null references market.instruments (id), interval text not null check (interval in ('5m', '30m', '1d', '1w', '1mo')), ts timestamptz not null,
  open numeric not null, high numeric not null, low numeric not null, close numeric not null, volume numeric not null check (volume >= 0), adjusted boolean not null default true,
  source_id text not null references market.data_sources (id), ingested_at timestamptz not null default now(),
  primary key (instrument_id, interval, ts), check (high >= greatest(open, close) and low <= least(open, close))
);
create table market.data_quarantine (id bigserial primary key, instrument_id text, source_id text, payload jsonb not null, reason text not null, created_at timestamptz not null default now());

create table market.fundamentals (instrument_id text not null references market.instruments (id), fiscal_year int not null, period text not null default 'FY', currency char(3) not null, revenue numeric, net_income numeric, eps numeric, gross_margin numeric, net_margin numeric, roe numeric, roic numeric, debt_equity numeric, source_id text references market.data_sources (id), primary key (instrument_id, fiscal_year, period));
create table market.valuation_metrics (instrument_id text primary key references market.instruments (id), market_cap_usd numeric, pe numeric, forward_pe numeric, pb numeric, ev_ebitda numeric, dividend_yield numeric, as_of timestamptz not null);
create table market.technical_metrics (instrument_id text primary key references market.instruments (id), rsi_14 numeric, sma_50 numeric, sma_200 numeric, high_52w numeric, low_52w numeric, beta numeric, volatility_30d numeric, max_drawdown_3y numeric, as_of timestamptz not null);
create table market.dividends (id bigserial primary key, instrument_id text not null references market.instruments (id), ex_date date not null, record_date date, pay_date date, amount numeric not null, currency char(3) not null, frequency text);
create table market.corporate_actions (id bigserial primary key, instrument_id text not null references market.instruments (id), action_date date not null, kind text not null, detail text, ratio numeric);
create table market.etf_profiles (instrument_id text primary key references market.instruments (id), issuer text, strategy text, benchmark text, inception date, expense_ratio numeric, aum_usd numeric, holdings_count int, distribution_yield numeric);
create table market.etf_holdings (etf_id text not null references market.instruments (id), position int not null, holding_instrument_id text references market.instruments (id), holding_name text not null, weight numeric not null, as_of date not null, primary key (etf_id, as_of, position));
create table market.etf_allocations (etf_id text not null references market.instruments (id), dimension text not null check (dimension in ('sector', 'country', 'asset')), label text not null, weight numeric not null, as_of date not null, primary key (etf_id, dimension, label, as_of));
create table market.index_profiles (instrument_id text primary key references market.instruments (id), provider text, constituents int, methodology_url text);
create table market.fx_pairs (instrument_id text primary key references market.instruments (id), base char(3) not null, quote char(3) not null, unique (base, quote));
create table market.commodity_profiles (instrument_id text primary key references market.instruments (id), unit text not null, reference_contract text);
create table market.bond_profiles (instrument_id text primary key references market.instruments (id), issuer text not null, maturity date, coupon numeric, yield numeric, duration numeric, rating text);
create table market.reit_profiles (instrument_id text primary key references market.instruments (id), property_type text, geography text, ffo_yield numeric, occupancy numeric);

create table market.news_articles (id text primary key, headline text not null, publisher text not null, url text not null, category text, published_at timestamptz not null, source_id text references market.data_sources (id));
create table market.news_assets (news_id text not null references market.news_articles (id) on delete cascade, instrument_id text not null references market.instruments (id), primary key (news_id, instrument_id));
create table market.research_documents (id text primary key, slug text not null, kind text not null check (kind in ('stocks', 'etfs', 'markets', 'themes')), doc_type text not null, title text not null, summary text, body jsonb not null, topic text, published_at timestamptz not null, unique (kind, slug));
create table market.research_assets (research_id text not null references market.research_documents (id) on delete cascade, instrument_id text not null references market.instruments (id), primary key (research_id, instrument_id));
create table market.themes (id text primary key, name text not null, description text);
create table market.theme_assets (theme_id text not null references market.themes (id) on delete cascade, instrument_id text not null references market.instruments (id), primary key (theme_id, instrument_id));
create table market.calendar_events (id text primary key, kind text not null check (kind in ('earnings', 'dividend', 'ipo', 'holiday', 'macro')), event_date date not null, title text not null, detail text, country_code char(2), instrument_id text references market.instruments (id), extra jsonb not null default '{}');
create index on market.calendar_events (event_date, kind);

-- What may be displayed, to whom, at what freshness. The API consults this before returning a field.
create table market.data_entitlements (
  id bigserial primary key, source_id text not null references market.data_sources (id), mic char(4) references market.exchanges (mic),
  dataset text not null check (dataset in ('quotes', 'ohlcv', 'fundamentals', 'holdings', 'news')),
  plan text not null default 'free', max_freshness text not null check (max_freshness in ('LIVE', 'DELAYED', 'END_OF_DAY')), display_allowed boolean not null default true
);

-- Public read, service-role write.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'market' and tablename <> 'data_quarantine'
  loop
    execute format('alter table market.%I enable row level security', t);
    execute format('create policy "public read" on market.%I for select using (true)', t);
  end loop;
end $$;
alter table market.data_quarantine enable row level security;
grant usage on schema market to anon, authenticated;
grant select on all tables in schema market to anon, authenticated;
revoke select on market.data_quarantine from anon, authenticated;
