#!/usr/bin/env bash
# Builds the INRGIFT server bundles (docs/DEPLOY.md). Environment values are never bundled; set them on the host.
#
#   deploy/inrgift-godaddy.zip     GoDaddy cPanel "Setup Node.js App". No node_modules; a minimal package.json with the
#                                  runtime dependencies pinned to the versions this build used. Upload, extract, click
#                                  "Run NPM Install", restart. (cPanel keeps node_modules in its own virtual
#                                  environment, so a bundled node_modules folder collides with it: npm ENOTEMPTY.)
#   deploy/inrgift-standalone.zip  VPS / any Node host. Self-contained with the traced node_modules; run `node server.js`.
set -euo pipefail
cd "$(dirname "$0")/.."
NEXT_OUTPUT=standalone npm run build
OUT=.next/standalone
cp -R public "$OUT/public"
mkdir -p "$OUT/.next" && cp -R .next/static "$OUT/.next/static"
rm -f "$OUT"/.env* # never ship local env files
mkdir -p deploy && rm -f deploy/inrgift-standalone.zip deploy/inrgift-godaddy.zip
(cd "$OUT" && zip -qr ../../deploy/inrgift-standalone.zip . -x '.env*')

# cPanel variant: same files without node_modules, with a runtime-only package.json.
CP=.next/godaddy
rm -rf "$CP" && mkdir -p "$CP"
(cd "$OUT" && tar cf - --exclude=./node_modules --exclude='./.env*' .) | (cd "$CP" && tar xf -)
node -e '
const v = (d) => require(require.resolve(d + "/package.json", { paths: [process.cwd()] })).version;
const deps = ["next", "react", "react-dom", "@supabase/ssr", "@supabase/supabase-js", "zod", "lucide-react"];
const pkg = {
  name: "inrgift", version: require("./package.json").version, private: true,
  description: "INRGIFT production server (Next.js standalone). Startup file: server.js",
  engines: { node: ">=18.18" },
  scripts: { start: "node server.js" },
  dependencies: Object.fromEntries(deps.map((d) => [d, v(d)])),
};
require("fs").writeFileSync(process.argv[1] + "/package.json", JSON.stringify(pkg, null, 2) + "\n");
' "$CP"
(cd "$CP" && zip -qr ../../deploy/inrgift-godaddy.zip .)
rm -rf "$CP"
echo "deploy/inrgift-godaddy.zip ($(du -h deploy/inrgift-godaddy.zip | cut -f1)): cPanel, then Run NPM Install. Startup file: server.js"
echo "deploy/inrgift-standalone.zip ($(du -h deploy/inrgift-standalone.zip | cut -f1)): VPS, node server.js"
