# Deploying INRGIFT on GoDaddy

GoDaddy provides both the domain and the hosting. INRGIFT is a Next.js 15 server app: it needs a running Node.js
process because of middleware, route handlers and server rendering. Static-only hosting will not work.

## 1. Choose the GoDaddy plan

| Plan | Works? | Notes |
| --- | --- | --- |
| cPanel Web Hosting with **Setup Node.js App** | Yes, if the plan offers Node.js 18.18+ (20 LTS recommended) | Upload the standalone bundle; startup file `server.js` |
| VPS / Dedicated | Yes | Run `node server.js` under a process manager (pm2 or systemd) behind nginx or Apache with TLS |
| Website Builder / Managed WordPress | No | No Node.js runtime |

To check the plan: cPanel → search for "Node.js". If **Setup Node.js App** is listed, the plan supports Node.js.
GoDaddy retires older Node versions over time ([GoDaddy help](https://www.godaddy.com/en-in/help/retiring-older-versions-of-nodejs-and-ruby-42764)),
so pick the newest one offered.

## 2. Build the bundle

On any machine with Node 20:

```bash
npm ci
npm run package:godaddy   # → deploy/inrgift-standalone.zip (server.js, .next/, public/, minimal node_modules)
```

The zip contains no environment values; they are set on the host (step 4).

## 3. cPanel → Setup Node.js App

1. **Create application:**
   - Node.js version: the newest available, at least 18.18.
   - Application mode: Production.
   - Application root: for example `inrgift`.
   - Application URL: the domain.
   - Application startup file: `server.js`.
2. Upload `deploy/inrgift-standalone.zip` to the application root with File Manager and extract it there.
   `server.js` must sit directly in the application root.
3. Add the environment variables from step 4 in the app's **Environment variables** section.
4. Click **Restart**, then open the domain.

`npm install` is not needed: the standalone bundle already contains the production dependencies.

## 4. Environment variables (production)

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

`NEXT_PUBLIC_*` values are compiled into the browser bundle at build time. Set them in the shell (or a
`.env.production.local` file) on the machine that runs `npm run package:godaddy` as well as in cPanel. Never set
`NEXT_PUBLIC_AUTH_MODE` in production.

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
