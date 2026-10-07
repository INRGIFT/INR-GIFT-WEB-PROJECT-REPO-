#!/usr/bin/env bash
# Validates a GoDaddy source zip before upload. Exits non-zero on any failure.
#   scripts/validate-godaddy-zip.sh [deploy/inrgift-godaddy-source.zip]
set -uo pipefail
ZIP=${1:-deploy/inrgift-godaddy-source.zip}
[ -f "$ZIP" ] || { echo "FAIL  zip not found: $ZIP" >&2; exit 1; }
command -v unzip >/dev/null || { echo "FAIL  unzip is required" >&2; exit 1; }

ENTRIES=$(unzip -Z1 "$ZIP")
fails=0
pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; fails=$((fails + 1)); }
none() { # label, extended regex over entry paths
  local hits; hits=$(grep -E "$2" <<<"$ENTRIES" | head -5)
  if [ -z "$hits" ]; then pass "$1"; else fail "$1"; sed 's/^/        /' <<<"$hits"; fi
}

grep -qx 'package.json' <<<"$ENTRIES" && pass "package.json at zip root" || fail "package.json at zip root"
grep -qx 'package-lock.json' <<<"$ENTRIES" && pass "package-lock.json at zip root" || fail "package-lock.json at zip root"
none "no nested project folder (no */package.json at the second level)" '^[^/]+/package\.json$'
none "no node_modules anywhere" '(^|/)node_modules(/|$)'
none "no .next build output anywhere" '(^|/)\.next(/|$)'
none "no .env files anywhere" '(^|/)\.env'
none "no key, certificate or credential files" '(^|/)(id_rsa[^/]*|[^/]*\.(pem|key|p12|pfx)|\.npmrc|credentials[^/]*\.json|service-account[^/]*\.json)$'
none "no test output, caches or OS junk" '(^|/)(coverage|test-results|playwright-report|\.turbo|\.cache)(/|$)|(^|/)(\.DS_Store|Thumbs\.db|tsconfig\.tsbuildinfo)$|~$'

# Secret values in file contents (Supabase secret keys, private keys, service-role assignments with a value).
if unzip -p "$ZIP" | grep -aqE 'sb_secret_[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|SUPABASE_SERVICE_ROLE_KEY *= *[^ $]'; then
  fail "no secret values in file contents"
else
  pass "no secret values in file contents"
fi

# package.json contract: name, version, build, start, engines.
if PKG=$(unzip -p "$ZIP" package.json 2>/dev/null); then
  REPORT=$(node -e '
    const p = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const s = p.scripts || {};
    const checks = [
      ["name is set", !!p.name],
      ["version is set", !!p.version],
      ["build script runs next build (" + s.build + ")", /\bnext build\b/.test(s.build || "")],
      ["start script runs next start (" + s.start + ")", /\bnext start\b/.test(s.start || "")],
      ["start script does not hard-code a port", !/(-p|--port)\s*\d+|PORT=\d+/.test(s.start || "")],
      ["engines.node is set (" + (p.engines && p.engines.node) + ")", !!(p.engines && p.engines.node)],
      ["next is a runtime dependency", !!(p.dependencies && p.dependencies.next)],
    ];
    for (const [label, ok] of checks) console.log((ok ? "PASS" : "FAIL") + "  package.json: " + label);
  ' <<<"$PKG" 2>&1) || true
  echo "$REPORT"
  fails=$((fails + $(grep -c '^FAIL' <<<"$REPORT")))
  [ -n "$REPORT" ] || fail "package.json is valid JSON"
else
  fail "package.json readable"
fi

echo "---"
echo "top-level entries:"
cut -d/ -f1 <<<"$ENTRIES" | sort -u | sed 's/^/  /'
echo "files: $(grep -vc '/$' <<<"$ENTRIES")   size: $(du -h "$ZIP" | cut -f1)"
if [ "$fails" -eq 0 ]; then echo "RESULT: $ZIP is valid for GoDaddy upload"; else echo "RESULT: $fails check(s) failed; do not upload" >&2; exit 1; fi
