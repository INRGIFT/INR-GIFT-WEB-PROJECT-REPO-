-- Backfill checks for migration 0008 (after gift-id.prefill.sql): existing accounts each received exactly one GIFT ID,
-- the account without a profile got one too, and no account identity changed.
\set ON_ERROR_STOP 1
do $$ begin
  assert (select count(*) from public.profiles where user_id in ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e3') and gift_id ~ '^GIFT-[0-9A-HJKMNP-TV-Z]{8}$') = 3, 'every existing account received a GIFT ID';
  assert exists (select 1 from public.profiles where user_id = '00000000-0000-0000-0000-0000000000e3'), 'a missing profile was created';
  assert (select count(*) from public.gift_id_registry) = (select count(*) from auth.users), 'exactly one registry row per account';
  assert (select count(distinct gift_id) from public.profiles) = (select count(*) from auth.users), 'no two accounts share a GIFT ID';
  assert not exists (select 1 from public.test_backfill_before b join auth.users u on u.id = b.id where u.email is distinct from b.email), 'account ids and emails are unchanged';
end $$;
drop table public.test_backfill_before;
\echo 'GIFT ID backfill tests passed'
