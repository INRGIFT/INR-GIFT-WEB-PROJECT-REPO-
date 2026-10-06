-- INRGIFT private user workspace.
-- Research data only: there is deliberately no portfolio, order, position or brokerage table.
-- Ownership is set by the database (default auth.uid()) and enforced by RLS; the client never supplies it.

create extension if not exists "pgcrypto";

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  country text,
  phone_verified boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  currency text not null default 'LOCAL' check (currency in ('LOCAL', 'INR')),
  timezone text not null default 'Asia/Kolkata',
  locale text not null default 'en-IN',
  regions text[] not null default '{}',
  asset_classes text[] not null default '{}',
  themes text[] not null default '{}',
  notify_email boolean not null default true,
  notify_in_app boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  watchlist_id uuid not null references public.watchlists (id) on delete cascade,
  instrument_id text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (watchlist_id, instrument_id)
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  instrument_id text not null,
  kind text not null check (kind in ('price_above', 'price_below', 'pct_move', 'high_52w', 'low_52w', 'valuation', 'earnings', 'dividend', 'news', 'research')),
  threshold numeric,
  status text not null default 'active' check (status in ('active', 'paused', 'triggered')),
  channel text not null default 'in_app' check (channel in ('in_app', 'email')),
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.saved_screens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  definition text not null,
  universe text not null default 'all',
  created_at timestamptz not null default now()
);

create table public.saved_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  instrument_ids text[] not null check (cardinality(instrument_ids) between 2 and 4),
  created_at timestamptz not null default now()
);

create table public.saved_research (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ref_type text not null check (ref_type in ('document', 'asset')),
  ref_id text not null,
  title text not null,
  href text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, ref_type, ref_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '',
  tags text[] not null default '{}',
  instrument_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recent_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('asset', 'screen', 'comparison', 'research')),
  title text not null,
  href text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('market', 'research', 'account', 'system')),
  title text not null,
  body text not null default '',
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.watchlist_items (user_id, watchlist_id);
create index on public.alerts (user_id, status);
create index on public.recent_history (user_id, created_at desc);
create index on public.notifications (user_id, read, created_at desc);

-- Row-level security: every table, owner only.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'user_preferences', 'watchlists', 'alerts', 'saved_screens', 'saved_comparisons', 'saved_research', 'notes', 'recent_history', 'notifications']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('create policy "owner reads" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "owner inserts" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "owner updates" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "owner deletes" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Child rows are additionally checked against the parent's owner, so an item can never be attached to someone else's list.
alter table public.watchlist_items enable row level security;
alter table public.watchlist_items force row level security;
create policy "owner reads" on public.watchlist_items for select using (auth.uid() = user_id);
create policy "owner deletes" on public.watchlist_items for delete using (auth.uid() = user_id);
create policy "owner inserts into own list" on public.watchlist_items for insert
  with check (auth.uid() = user_id and exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = auth.uid()));
create policy "owner updates within own list" on public.watchlist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = auth.uid()));

-- Ownership can never be reassigned after insert.
create or replace function public.lock_user_id() returns trigger language plpgsql as $$
begin
  if new.user_id is distinct from old.user_id then raise exception 'user_id is immutable'; end if;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['watchlists', 'watchlist_items', 'alerts', 'saved_screens', 'saved_comparisons', 'saved_research', 'notes', 'recent_history', 'notifications']
  loop execute format('create trigger lock_owner before update on public.%I for each row execute function public.lock_user_id()', t); end loop;
end $$;

-- A profile, preferences row and default watchlist are created with each new user.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  insert into public.user_preferences (user_id) values (new.id);
  insert into public.watchlists (user_id, name) values (new.id, 'My watchlist');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
