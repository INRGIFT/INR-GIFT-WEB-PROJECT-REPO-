-- Accounts that exist BEFORE migration 0008 (run by scripts/verify-db.sh only in the pass that applies 0008 without
-- 0007, between 0006 and 0008): two ordinary accounts and one whose profile row is missing.
\set ON_ERROR_STOP 1
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'early1@example.com', now(), '{"full_name":"Early One"}'),
  ('00000000-0000-0000-0000-0000000000e2', 'early2@example.com', now(), '{"full_name":"Early Two"}'),
  ('00000000-0000-0000-0000-0000000000e3', 'early3@example.com', now(), '{"full_name":"Early Three"}');
delete from public.profiles where user_id = '00000000-0000-0000-0000-0000000000e3';
create table public.test_backfill_before as select id, email from auth.users;
