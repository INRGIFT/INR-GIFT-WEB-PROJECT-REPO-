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
| `NEXT_PUBLIC_SITE_URL` | `https://inrgift.com` (no trailing slash; used for canonical URLs, email links and redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://odiflbsoitgktylaksng.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key from Supabase → Project Settings → API keys |
| `NEXT_PUBLIC_LOGO_PROVIDER` | `logo.dev` |
| `NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY` | Logo.dev `pk_…` key |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API keys → secret key (server only; records verified phones) |
| `SEND_EMAIL_HOOK_SECRET` | Supabase → Authentication → Hooks → Send Email secret (`v1,whsec_…`) |
| `RESEND_API_KEY` | Resend API key (sending access) |
| `RESEND_FROM_EMAIL` | `INRGIFT Support <support@inrgift.com>` (inrgift.com verified in Resend; a bare address gets the "INRGIFT Support" name) |
| `TWO_FACTOR_API_KEY` | 2Factor.in API key |
| `TWO_FACTOR_OTP_TEMPLATE` | 2Factor OTP template name approved for INRGIFT (DLT) — after DLT approval |
| `SUPPORT_PHONE` | Optional. Shown on Support, the footer and legal pages only when set. Leave empty until a real number exists |
| `SUPPORT_INBOX_EMAIL` | Optional. Where form submissions go; default `support@inrgift.com` |
| `GOOGLE_SIGN_IN` | Optional. `off` hides "Continue with Google"; otherwise it follows the Google provider switch in Supabase |
| `APPLE_SIGN_IN` | Optional. `off` hides "Continue with Apple"; otherwise it follows the Apple provider switch in Supabase |
| `INRGIFT_RELEASE_COMMIT` | Optional. The commit id, for `/api/health` when the host builds without `release.json` or `.git` |
| `NEXT_PUBLIC_EMAIL_OTP_MINUTES` | Optional, default `60`. Lifetime of the six-digit sign-up code, used in the email and the "expired" message; must equal Supabase's Email OTP expiration (section 6) |
| `NEXT_PUBLIC_SMS_SECOND_FACTOR` | **Leave empty (off)** until DLT approval, the 2Factor key and migration 0007 are in place; then `on` and rebuild (`docs/AUTH-SECURITY.md`) |
| `NEWSIO_API_KEY` | NewsData.io API key |
| `NEWSIO_PAGE_SIZE` / `NEWSIO_CACHE_SECONDS` | Optional: 10 / 900 by default (free-plan safe) |
| `MARKET_DATA_PROVIDER` | `demo` until a licensed feed is connected |
| `INGEST_SECRET` | A long random string, only if `/api/internal/ingest` is used |
| `SITE_INDEXABLE` | Leave empty. Demo data is never indexed. |

`NEXT_PUBLIC_*` values no longer need to exist at build time. **Incident, 7 Oct 2026:** GoDaddy's variables reached
the running server but not `next build`, so the browser bundle had no Supabase settings and `/login` showed "Sign-in is
not available on this site yet." Since then the server reads these settings at runtime and writes the browser-safe ones
into each page (`src/lib/config.ts`, `src/app/layout.tsx`); a restart picks up a change, no rebuild needed. Secrets
are never part of that hand-off.

**Check a deployment:** `https://inrgift.com/api/health` shows `release.commit` (the commit the zip was packaged
from), `configuration.authMode` (`supabase` expected), and booleans `siteUrlConfigured`,
`supabaseUrlConfigured`, `supabasePublishableKeyConfigured`. It never shows a value or key. Never set `NEXT_PUBLIC_AUTH_MODE` in production. The Supabase secret key and the
Resend, 2Factor.in and NewsData.io keys are server-only: never `NEXT_PUBLIC_`, never in the zip or the repository,
only in GoDaddy's environment variables. After the first deploy, configure the Supabase hook and settings listed in
`docs/CONNECTORS.md` and run its manual production smoke test.

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
- **Site URL:** `https://inrgift.com`
- **Redirect URLs:** `https://inrgift.com/auth/confirm`, `https://inrgift.com/auth/callback`, and
  `http://localhost:3000/**` for development.

### Google sign-in (Google Cloud Console, then Supabase)
No Google secret is ever placed in the repository, the zip, GoDaddy or the browser: it is entered only in Supabase.
1. Google Cloud Console → select or create the INRGIFT project → **APIs & Services → OAuth consent screen**: app name
   INRGIFT, support email support@inrgift.com, authorised domain `inrgift.com`, links to
   `https://inrgift.com/privacy-policy` and `https://inrgift.com/terms-and-conditions`; scopes `openid`, `email`,
   `profile` only; publish the app.
2. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorised JavaScript origins: `https://inrgift.com` (and `http://localhost:3000` for development).
   - Authorised redirect URI: **`https://odiflbsoitgktylaksng.supabase.co/auth/v1/callback`** (Supabase's callback for
     this project; Google returns to Supabase, which then returns to `https://inrgift.com/auth/callback`).
3. Supabase → Authentication → **Sign In / Providers → Google**: enable, paste the Client ID and Client Secret, save.
4. Supabase → Authentication → URL Configuration: the redirect URLs above must include
   `https://inrgift.com/auth/callback**` (already required).
5. Check: `https://inrgift.com/api/health` shows `integrations.google.signIn: "enabled"` (within 5 minutes), and
   `/login` shows **Continue with Google**.

### Six-digit email verification code (sign-up step 2)
Supabase → Authentication → **Sign In / Providers → Email**:
- **Confirm email:** on.
- **Email OTP length:** `6`.
- **Email OTP expiration:** `3600` seconds (60 minutes), or whatever `NEXT_PUBLIC_EMAIL_OTP_MINUTES` × 60 is set to.
The Send Email hook (below) delivers the code through Resend, so no Supabase email template needs editing. Check: a new
sign-up receives "Verify your INRGIFT email" with a six-digit code and no link.

Then, under Authentication → Hooks, enable the **Send Email** hook (HTTPS) at `https://inrgift.com/api/hooks/send-email`
and copy its secret into `SEND_EMAIL_HOOK_SECRET` on GoDaddy, then restart the app (environment variables are read at
start). Until **both** are done, Supabase's built-in mailer sends its own "Supabase Auth" link email instead of the
INRGIFT code email (the cause of the 7 Oct 2026 sign-up emails, `docs/CONNECTORS.md`). Check: `/api/health` →
`integrations.resend.sendEmailHook: true`; a brand-new sign-up receives "Verify your INRGIFT email" from
INRGIFT Support <support@inrgift.com> with six digits and no link; Supabase → Logs → Auth shows no `mail.send` from
`mail.app.supabase.io` for it. With the hook on, every auth email goes through Resend and the
Supabase email templates and SMTP are not used. Leave **Phone** provider and **MFA** off in Supabase: SMS goes through
2Factor.in via INRGIFT's server, never Supabase.

### Database migration 0008 (GIFT ID)
Apply `supabase/migrations/0008_gift_id.sql` **on its own**, after the new code is deployed (the code works before and
after: without the column, the GIFT ID shows as "being assigned").
1. Supabase → SQL Editor → New query → paste the **whole** file → Run. PostgreSQL runs a multi-statement batch as one
   transaction, so if the verification at the end of the file fails, nothing is kept. Or use the Supabase MCP
   `apply_migration` with the file's contents.
2. **Never** `supabase db push`: it would also apply 0007, which must stay unapplied until SMS is switched on.
3. Check (SQL Editor): `select count(*) filter (where gift_id is null) as missing, count(*) as accounts, count(distinct gift_id) as ids from public.profiles;`
   → `missing` 0 and `accounts` = `ids` = `select count(*) from auth.users`.
4. If the Supabase CLI is used later, record it as applied: `supabase migration repair --status applied 0008`.
Rollback: the column, triggers and functions can be dropped, but **keep `gift_id_registry`**, or IDs could be reissued.

## 7. Smoke test after deploy

- `/` loads with the official logo, favicon and share image. Signed out, `/markets` and `/app` redirect to
  `https://inrgift.com/login?next=…`, `/legal/terms` redirects to `/terms-and-conditions`, an unknown path such as
  `/this-page-does-not-exist` shows the 404 page, and `/api/v1/assets` answers 401.
- `/api/health` → `release.commit` names the deployed commit (from `release.json` in the zip, or the build).
- `/api/health` reports `auth: supabase`, `demo: false` and `twofactor.secondFactor: off` (until SMS is switched on).
- `/terms-and-conditions`, `/privacy-policy`, `/about`, `/support`, `/account-closure`, `/grievance-redressal` open
  signed out; a test support form submission reaches support@inrgift.com with a reference.
- Google (after the Google steps): Continue with Google → Google → back on inrgift.com → "Complete your INRGIFT
  profile" (mobile number, password, country, terms) → onboarding → workspace; sign out; sign in with that email and
  password.
- Sign up with email, mobile number and password; "Verify your INRGIFT email" arrives from Resend with a six-digit
  code; a wrong code says "Incorrect verification code…"; the right one shows "Email verified ✓" and moves to step 3
  (mobile number) → onboarding → "Your INRGIFT account is ready." with a GIFT ID (after migration 0008) → `/app`
  ("Hola AMIGO, <first name>"). Add a watchlist item; sign out and back in. The item should persist; that is the
  Supabase round trip. `/account/profile` shows the same GIFT ID with Copy GIFT ID.
- `/robots.txt` disallows everything while the site serves demo data.
