#!/usr/bin/env bash
# Applies every migration in supabase/migrations to a throwaway local PostgreSQL cluster and runs the RLS tests.
# Requires PostgreSQL 15+ binaries (initdb, pg_ctl, psql). Nothing touches a real Supabase project.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DIR="$(mktemp -d)"; PORT="${PG_PORT:-54329}"
RUN=(); [ "$(id -u)" = "0" ] && { chown -R postgres "$DIR"; RUN=(runuser -u postgres --); }
cleanup() { "${RUN[@]}" "$BIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
"${RUN[@]}" "$BIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
"${RUN[@]}" "$BIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null
PSQL=("${RUN[@]}" "$BIN/psql" -h "$DIR" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
# Pass 1: every migration in order (the target state once SMS is switched on), then the RLS and GIFT ID tests.
"${PSQL[@]}" -f "$ROOT/supabase/tests/local-auth-shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do echo "apply $(basename "$f")"; "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f "$ROOT/supabase/tests/rls.test.sql"
"${PSQL[@]}" -f "$ROOT/supabase/tests/gift-id.test.sql"
"${PSQL[@]}" -f "$ROOT/supabase/tests/notifications.test.sql"
# Pass 2: production today. 0001-0006 with existing accounts, then 0008 WITHOUT 0007 (0007 stays unapplied until the
# SMS second factor is switched on): the GIFT ID backfill and the GIFT ID tests must hold there too.
"${PSQL[@]}" -c "create database pass2"
PSQL2=("${RUN[@]}" "$BIN/psql" -h "$DIR" -p "$PORT" -U postgres -d pass2 -v ON_ERROR_STOP=1 -q -X)
# Roles are cluster-wide and already exist; the rest of the shim is per database.
grep -v '^create role' "$ROOT/supabase/tests/local-auth-shim.sql" > "$DIR/shim-pass2.sql"; [ "$(id -u)" = "0" ] && chown postgres "$DIR/shim-pass2.sql"
"${PSQL2[@]}" -f "$DIR/shim-pass2.sql"
for f in "$ROOT"/supabase/migrations/000[1-6]_*.sql; do echo "pass 2: apply $(basename "$f")"; "${PSQL2[@]}" -f "$f"; done
"${PSQL2[@]}" -f "$ROOT/supabase/tests/gift-id.prefill.sql"
echo "pass 2: apply 0008_gift_id.sql (without 0007)"; "${PSQL2[@]}" -f "$ROOT/supabase/migrations/0008_gift_id.sql"
"${PSQL2[@]}" -f "$ROOT/supabase/tests/gift-id.backfill.test.sql"
"${PSQL2[@]}" -f "$ROOT/supabase/tests/gift-id.test.sql"
# Concurrency: 12 parallel sessions repair the same account (profile removed, as with legacy data) and 12 more create
# brand-new accounts at once. The account must end with exactly one GIFT ID, and no two accounts may share one.
"${PSQL2[@]}" -c "insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000d1', 'd1@example.com', '{\"full_name\":\"Race\"}')"
"${PSQL2[@]}" -c "alter table public.profiles disable trigger keep_profile; delete from public.profiles where user_id = '00000000-0000-0000-0000-0000000000d1'; alter table public.profiles enable trigger keep_profile;"
pids=()
for i in $(seq 1 12); do
  "${PSQL2[@]}" -c "select public.ensure_user_profile('00000000-0000-0000-0000-0000000000d1')" >/dev/null & pids+=($!)
  "${PSQL2[@]}" -c "insert into auth.users (email, raw_user_meta_data) values ('race$i@example.com', '{}')" >/dev/null & pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done
"${PSQL2[@]}" -c "do \$\$ begin
  assert (select count(*) from public.gift_id_registry where user_id = '00000000-0000-0000-0000-0000000000d1') = 1, 'concurrent repair: one GIFT ID for the account';
  assert (select count(*) from public.profiles where user_id = '00000000-0000-0000-0000-0000000000d1') = 1, 'concurrent repair: one profile';
  assert (select count(*) from auth.users where email like 'race%') = 12, 'concurrent sign-ups all created';
  assert not exists (select 1 from auth.users u left join public.profiles p on p.user_id = u.id where p.gift_id is null), 'no account without a GIFT ID';
  assert not exists (select gift_id from public.profiles group by gift_id having count(*) > 1), 'no duplicate GIFT IDs';
end \$\$;"
echo "GIFT ID concurrency tests passed"
echo "pass 2: apply 0009_notifications.sql (without 0007)"; "${PSQL2[@]}" -f "$ROOT/supabase/migrations/0009_notifications.sql"
"${PSQL2[@]}" -c "do \$\$ begin assert (select count(*) from public.notification_events where event_type = 'GIFT_ID_ASSIGNED') = (select count(*) from public.gift_id_registry r join auth.users u on u.id = r.user_id where r.retired_at is null), 'every existing account is queued its GIFT ID email once'; end \$\$;"
"${PSQL2[@]}" -f "$ROOT/supabase/tests/notifications.test.sql"
echo "database verification passed"
