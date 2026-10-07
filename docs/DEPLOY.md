# Deploying INRGIFT on GoDaddy

GoDaddy provides both the domain and the hosting. INRGIFT is a Next.js 15 server app: it needs a running Node.js
process because of middleware, route handlers and server rendering. Static-only hosting will not work.

## How the GoDaddy deployment works

GoDaddy Node.js Hosting receives a **source zip** and does the rest:

```
upload inrgift-godaddy-source.zip → GoDaddy: npm install → npm run build (next build) → npm start (next start)
```

- The zip root contains `package.json` and `package-lock.json`. There is no nested project folder.
- The zip **never contains `node_modules`**. GoDaddy installs the dependencies itself.
  Uploading a `node_modules` tree, or a prebuilt standalone bundle that carries one, collides with GoDaddy's install and
  fails with `npm error code ENOTEMPTY ... rmdir '/app/node_modules/...'`.
- The zip never contains `.next`, `.env` files or secrets. Secrets are set as environment variables in GoDaddy (and in
  the Supabase dashboard), never committed and never packaged.
- `next start` listens on the `PORT` environment variable that GoDaddy provides (default 3000). No port is hard-coded.
- Everything `next build` needs (TypeScript, Tailwind, PostCSS, type packages) is in `dependencies`. The build
  therefore works even if GoDaddy installs with production settings and skips `devDependencies`.
- `engines.node` is `20.x`.

## 1. Choose the GoDaddy plan

| Plan | Works? | Notes |
| --- | --- | --- |
| Node.js Hosting / cPanel with a Node.js app | Yes, with Node.js 20 | Upload the source zip; GoDaddy installs, builds and starts |
| VPS / Dedicated | Yes | Unzip the same source zip, then `npm ci && npm run build && npm start` under pm2 or systemd behind nginx/Apache with TLS |
| Website Builder / Managed WordPress | No | No Node.js runtime |

GoDaddy retires older Node versions over time ([GoDaddy help](https://www.godaddy.com/en-in/help/retiring-older-versions-of-nodejs-and-ruby-42764)).
Choose Node.js 20.

## 2. Build the source zip

Commit your changes first. The zip is made from the committed tree, and the script refuses uncommitted edits in the
packaged paths.

```bash
npm run package:godaddy    # → deploy/inrgift-godaddy-source.zip, then validates it
npm run validate:godaddy   # re-run the validation on an existing zip
```

The script uses `git archive` on `HEAD` and includes only what the production build reads:

- `package.json` and `package-lock.json`
- `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs` and `tailwind.config.ts`
- `README.md`
- `src/` and `public/`

Tests, e2e, docs, SQL migrations and scripts stay in the repository. Untracked files cannot enter the zip:
`node_modules`, `.next`, `.env*`, test output and caches.

`scripts/validate-godaddy-zip.sh` fails the run if any of these is true:
- `package.json` or `package-lock.json` is missing from the root
- the files sit in a nested project folder
- the zip contains `node_modules`, `.next`, `.env*`, key or credential files, test output, caches, or secret values
- `package.json` lacks a name, version, `next build`, `next start`, `engines.node` or `next` as a dependency
- the start script hard-codes a port

## 3. Upload to GoDaddy

1. In the GoDaddy Node.js app settings:
   - Node.js version: **20**.
   - Mode: production.
   - Build command (if asked): `npm run build`.
   - Start command (if asked): `npm start`.
   - If the screen asks for an application startup file instead of a start command, see "Remaining GoDaddy
     questions" below.
2. Add the environment variables from step 4 **before the first build**. `NEXT_PUBLIC_*` values are compiled in
   during `npm run build`.
3. Upload `deploy/inrgift-godaddy-source.zip` and extract it so `package.json` sits directly in the application
   root.
4. Let GoDaddy run the install and the build (or click **Run NPM Install**, then run the build), then start or
   restart the app.

**Upload only** `inrgift-godaddy-source.zip`.

**Never upload:**
- `node_modules`
- `.next`
- `.env` or `.env.local`
- the whole repository folder
- an older `inrgift-standalone.zip` or `inrgift-godaddy.zip` (both carried build output)

### If an earlier upload failed with ENOTEMPTY
The application root still holds the `node_modules` tree from the old upload.
1. Stop the app.
2. In File Manager, open the application root and turn on **Show Hidden Files**. Delete everything there,
   including `node_modules` and `.next`.
3. If the error persists, delete the Node.js application and create it again with the same settings. This also clears
   GoDaddy's own install environment.
4. Upload the source zip again (step 3).

### Remaining GoDaddy questions (account-specific, not application code)
- **Startup file:** some cPanel "Setup Node.js App" screens ask for a startup *file* rather than a start *command*,
  and launch it with Node directly. Next.js has no such file in a normal build. If your screen only accepts a file,
  tell engineering. A one-file launcher (`require('next/dist/bin/next')` with `start`) can be added. It is not added
  pre-emptively.
- **Build step:** if the plan runs only `npm install` and never `npm run build`, run the build from the app's
  terminal or "Run JS script" option (`build`) before starting. `next start` refuses to start without a build.
- **Memory:** `next build` needs roughly 1–2 GB of RAM. Shared plans with less memory can kill the build. A VPS
  avoids this.

## 4. Environment variables (production)

Set these in GoDaddy's environment variables screen, never in a file inside the zip.

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://odiflbsoitgktylaksng.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key from Supabase → Project Settings → API keys |
| `NEXT_PUBLIC_LOGO_PROVIDER` | `logo.dev` |
| `NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY` | Logo.dev `pk_…` key |
| `MARKET_DATA_PROVIDER` | `demo` until a licensed feed is connected |
| `INGEST_SECRET` | A long random string, only if `/api/internal/ingest` is used |
| `SITE_INDEXABLE` | Leave empty. Demo data is never indexed. |

`NEXT_PUBLIC_*` values are compiled in during `npm run build`, which runs on GoDaddy. They must be set there before
the build, and changing one requires a rebuild. Never set `NEXT_PUBLIC_AUTH_MODE` in production. Never add the
Supabase service-role or secret key to the app.

## 5. Domain and TLS (GoDaddy DNS)

- If the domain and hosting are in the same GoDaddy account, attaching the domain to the hosting plan sets DNS
  automatically.
- Otherwise point an `A` record for `@` at the hosting IP shown in cPanel, and a `CNAME` for `www` at `@`.
- Turn on the free SSL certificate in cPanel (**SSL/TLS Status → Run AutoSSL**).
- Redirect `www` to the apex (or the reverse) so there is one canonical origin.
- The site sends HSTS (`next.config.mjs`), so make sure HTTPS works before sharing the URL.

No DNS change has been made by this repository or by Claude.

## 6. Supabase settings that depend on the domain

In the Supabase dashboard for project `odiflbsoitgktylaksng` (Authentication → URL Configuration):
- **Site URL:** `https://<your-domain>`
- **Redirect URLs:** `https://<your-domain>/auth/confirm`, `https://<your-domain>/auth/callback`, and
  `http://localhost:3000/**` for development.

Then, under Authentication → Emails, paste the templates from `supabase/templates`. Until custom SMTP is configured,
Supabase sends only about 2 emails an hour, and only to members of the Supabase organisation.

## 7. Smoke test after deploy

- `/`, `/markets` and `/assets/stocks` load. The header shows the official logo, and the favicon and share image
  are the official ones.
- `/app` redirects to `/login?next=%2Fapp`.
- Sign up with an organisation-member email, confirm via the link (lands on `/auth/confirm`), finish onboarding,
  add a watchlist item, sign out and back in. The watchlist item should persist; that is the Supabase round trip.
- `/robots.txt` disallows everything while the site serves demo data.
