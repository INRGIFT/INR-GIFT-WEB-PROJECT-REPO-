-- Contact and support messages. Anyone may submit; nobody can read them through the API.
-- Staff read them with the service role (dashboard or an internal tool), never from the client.
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  topic text not null check (topic in ('support', 'data', 'account', 'feedback', 'partnership', 'grievance', 'plans')),
  message text not null check (char_length(message) between 10 and 4000),
  page text check (char_length(page) <= 300),
  created_at timestamptz not null default now()
);
alter table public.support_requests enable row level security;
alter table public.support_requests force row level security;
-- Insert only. A signed-in user can only attach their own id; anonymous submissions have a null user_id.
create policy "anyone submits" on public.support_requests for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
-- No select, update or delete policies: rows are invisible to anon and authenticated roles.
