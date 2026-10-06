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
"${PSQL[@]}" -f "$ROOT/supabase/tests/local-auth-shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do echo "apply $(basename "$f")"; "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f "$ROOT/supabase/tests/rls.test.sql"
echo "database verification passed"
