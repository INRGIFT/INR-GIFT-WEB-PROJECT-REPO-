#!/usr/bin/env bash
# Builds a self-contained Node.js bundle for GoDaddy cPanel "Setup Node.js App" (or any Node host).
# Output: deploy/inrgift-standalone.zip containing server.js, .next/, public/ and a minimal node_modules.
# Environment values are NOT bundled; set them in cPanel (see docs/DEPLOY.md).
set -euo pipefail
cd "$(dirname "$0")/.."
NEXT_OUTPUT=standalone npm run build
OUT=.next/standalone
cp -R public "$OUT/public"
mkdir -p "$OUT/.next" && cp -R .next/static "$OUT/.next/static"
rm -f "$OUT"/.env* # never ship local env files
mkdir -p deploy && rm -f deploy/inrgift-standalone.zip
(cd "$OUT" && zip -qr ../../deploy/inrgift-standalone.zip . -x '.env*')
echo "deploy/inrgift-standalone.zip ($(du -h deploy/inrgift-standalone.zip | cut -f1)). Startup file: server.js"
