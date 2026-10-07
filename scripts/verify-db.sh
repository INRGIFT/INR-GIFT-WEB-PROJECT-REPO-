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
echo "database verification passed"
