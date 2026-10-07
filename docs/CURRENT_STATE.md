# Current state (7 Oct 2026)

INRGIFT is a working, research-only web app. It runs end to end on **demo data** with **demo or Supabase auth**.
It is **not production-ready**. Live market data, production email and SMS, legal text and an analytics vendor are
not connected. `docs/RELEASE_READINESS.md` lists the gates.


**Update (7 Oct 2026, compliance + Google):** `/`, Terms and Conditions, Privacy Policy, About, Support, Account
Closure, Grievance Redressal and `/legal/*` are public; support, grievance and closure forms email support@inrgift.com
through Resend; Google sign-in (Supabase OAuth) is built and appears once the Google provider is enabled in Supabase.
The live `/login` "Sign-in is not available" incident was a build without `NEXT_PUBLIC_*` values; settings are now
read at runtime. Earlier:

**Update (7 Oct 2026, final audit for https://inrgift.com):** only `/` was public (plus auth pages); every other page and
`/api` route requires a verified account. Every account has email + phone + password. The SMS code step is built but
**switched off** (`NEXT_PUBLIC_SMS_SECOND_FACTOR`) until 2Factor.in DLT approval, so sign-in today is email + password
with a confirmed email; migration 0007 is applied together with switching SMS on.
SMS codes come from 2Factor.in through INRGIFT's server, auth email goes through Resend via the Supabase Send Email
Hook, and news comes from NewsData.io (demo headlines until its key is set). None of the three providers has been
exercised with real keys yet, and migration 0007 is not yet applied to the live Supabase project.

## What runs
- **Public product:** home, markets (28 markets, directory, detail with sessions, auctions, holidays and India-time
  hours), assets (90 instruments: 35 stocks, 8 ETFs, 4 REITs, 23 indices, 9 FX pairs, 6 commodities, 5 bonds).
  Every class has a detail page.
- **Discover:** a hub, heatmap, screener, compare (up to four assets, hideable sections, identity rows), collections
  and trending.
- **Research:** six kinds (stocks, ETFs, markets, themes, sectors, countries), all in the structured article format.
  The ETF review has eight steps.
- **Resources:** news by type with summaries, earnings, dividends, IPO, a calendar with time zone and source, 44 learn
  guides, 36 glossary terms, data and methodology.
- **Universal search:** `/` or Ctrl/⌘+K, an accessible combobox and recent searches. Results are grouped across asset
  classes, markets, exchanges, sectors, industries, research, news and learn. `/search` is noindex.
- **Auth and account:** sign up, verify email and phone, MFA, password recovery, onboarding, profile, settings
  (including analytics consent) and security.
- **Workspace:** watchlists, alerts (notify only), notifications, saved screens, saved comparisons, saved research,
  notes, collections, recent and history. Private data goes through `WorkspaceRepo` and is protected by RLS.
- **Platform:**
  - A route registry drives the auth guard, X-Robots-Tag and robots.txt.
  - Unknown entities return genuine 404s with recovery links.
  - An entity quality gate controls indexing and the sitemap. The sitemap is split into sections, with an index at
    `/sitemap.xml`.
  - Security headers include CSP.
  - Analytics is consent-gated, behind a sink interface.
  - Logs are structured JSON, and `/api/health` reports status.
- **Media:** eight captioned tutorial recordings of the real product, including "INRGIFT in 60 seconds" and
  "Universal search".

## What does not run
- **Live market data:** the NSE adapter exists but is not connected. There is no licence or credentials yet.
- **Production email (SMTP), SMS (phone OTP) and the domain:** these are owner actions (`docs/CONNECTORS.md`,
  `docs/DEPLOY.md`).
- **Analytics vendor and error-reporting vendor:** the interfaces exist, but nothing is connected.
- **Server-side alert evaluation:** alerts are evaluated in the browser.

## Verification on this commit
- `npm run typecheck`: passes.
- `npm test`: 119 tests pass. `npm run test:db`: migrations 0001–0007 and RLS pass on local Postgres.
- `npm run build`: passes (no env; and with Supabase + `NEXT_PUBLIC_SITE_URL=https://inrgift.com`).
- Playwright on demo builds: 88 pass + 6 SMS-only skipped (SMS off), 92 pass + 2 skipped (SMS on). They cover:
  - journeys
  - route statuses
  - 404s
  - noindex
  - axe on 12 pages
  - no overflow at 375, 390, 768, 1024, 1280 and 1440 px
  - reduced motion
  - failure cases
- GoDaddy source zip: built from HEAD and validated (no node_modules, .next or .env; package.json at root).
  A clean extract installed, built and started on `PORT`, and pages, a 404, the API and health were checked over HTTP.
