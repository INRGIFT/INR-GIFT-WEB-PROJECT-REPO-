#!/usr/bin/env bash
# Builds the GoDaddy Node.js Hosting SOURCE zip (docs/DEPLOY.md):
#
#   upload deploy/inrgift-godaddy-source.zip → GoDaddy runs npm install → npm run build → npm start
#
# The zip is made with `git archive` from the committed tree (HEAD), so it can never contain node_modules, .next,
# .env files, test output or any other untracked or uncommitted file. Only what the production build needs is
# included; tests, e2e, docs and SQL migrations stay in the repository. package.json sits at the zip root.
# The result is checked by scripts/validate-godaddy-zip.sh, and the script fails if validation fails.
set -euo pipefail
cd "$(dirname "$0")/.."

ZIP=deploy/inrgift-godaddy-source.zip
# Everything `next build` and `next start` read. Keep in step with next.config.mjs, tsconfig.json and tailwind.config.ts.
PATHS=(package.json package-lock.json next.config.mjs tsconfig.json postcss.config.mjs tailwind.config.ts README.md src public)

for p in "${PATHS[@]}"; do
  git ls-files --error-unmatch "$p" >/dev/null 2>&1 || { echo "error: $p is not tracked by git" >&2; exit 1; }
done
# The zip is built from HEAD. Refuse when packaged paths have uncommitted edits, so the upload matches the commit.
if [ -n "$(git status --porcelain -- "${PATHS[@]}")" ]; then
  echo "error: uncommitted changes in packaged paths; commit them first:" >&2
  git status --short -- "${PATHS[@]}" >&2
  exit 1
fi

mkdir -p deploy
rm -f deploy/*.zip
git archive --format=zip --output="$ZIP" HEAD -- "${PATHS[@]}"
# Release stamp (commit only, no secrets): /api/health reports it, so the live site can be matched to a commit.
STAMP=$(mktemp -d)
printf '{"commit":"%s","committedAt":"%s"}\n' "$(git rev-parse HEAD)" "$(git log -1 --format=%cI HEAD)" > "$STAMP/release.json"
(cd "$STAMP" && zip -q "$OLDPWD/$ZIP" release.json)
rm -rf "$STAMP"
echo "built $ZIP from $(git rev-parse --short HEAD) ($(du -h "$ZIP" | cut -f1))"
scripts/validate-godaddy-zip.sh "$ZIP"
