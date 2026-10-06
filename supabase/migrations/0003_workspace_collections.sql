-- INRGIFT workspace additions: personal collections, alert notes and notification references.
-- Same rules as 0001: research data only, ownership defaults to auth.uid(), RLS forced, owner-only policies.

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 280),
  instrument_ids text[] not null default '{}' check (cardinality(instrument_ids) <= 100),
  created_at timestamptz not null default now()
);
create index on public.collections (user_id, created_at desc);

alter table public.collections enable row level security;
alter table public.collections force row level security;
create policy "owner reads" on public.collections for select using (auth.uid() = user_id);
create policy "owner inserts" on public.collections for insert with check (auth.uid() = user_id);
create policy "owner updates" on public.collections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner deletes" on public.collections for delete using (auth.uid() = user_id);
create trigger lock_owner before update on public.collections for each row execute function public.lock_user_id();

-- Optional free-text reminder on an alert ("why I set this").
alter table public.alerts add column note text check (char_length(note) <= 280);

-- Links a notification to the row that produced it (an alert id for alert triggers), so alert history can be listed.
alter table public.notifications add column ref_id text;
create index on public.notifications (user_id, ref_id);

-- Onboarding completion is recorded on the profile; the client may set it for its own row only (RLS above).
comment on column public.profiles.onboarded_at is 'Set when the user finishes or skips onboarding.';
