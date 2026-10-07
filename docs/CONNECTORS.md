# Connectors

This page lists every external service INRGIFT needs, what is wired in the code, and what is still missing. Nothing
else is connected; do not add services because they are popular. Sources were checked with Firecrawl on 2026-10-06.
Anything marked **unverified** could not be confirmed from an official page.

| Area | Service | Code status | Live status |
| --- | --- | --- | --- |
| Domain | GoDaddy (registrar/DNS) | Nothing in code | Owner confirmed GoDaddy for domain; domain name not yet supplied |
| Hosting | GoDaddy (owner confirmed) | `npm run package:godaddy` → source zip (`deploy/inrgift-godaddy-source.zip`: package.json at root, no node_modules, no .next, no .env; GoDaddy runs npm install → npm run build → npm start); `docs/DEPLOY.md` | Not deployed |
| Market data | NSE (designated provider) | `src/providers/nse` source adapter + provider; `MARKET_DATA_PROVIDER=nse` | Not connected: no licensed product, spec or credentials |
| Database | Supabase Postgres, project `odiflbsoitgktylaksng` (ap-south-1, free plan) | Migrations 0001–0006 applied to the hosted project; RLS verified locally and live | Live; advisors clean (security) |
| Authentication | Supabase Auth (`@supabase/ssr` 0.12) | Login, signup, email verification, phone OTP, TOTP, reset, logout, guard | Project connected; Site URL/redirects, templates, SMTP and SMS still to set in the dashboard |
| Storage | Supabase Storage | Not used: no upload feature exists, so no buckets | n/a |
| Stock/ETF logos | Logo.dev (replaceable) | `src/lib/logos` + `AssetLogo` with ticker-tile fallback | Publishable key supplied (in `.env.local`, gitignored; set it on the host) |
| Email | Resend via Supabase custom SMTP | Templates in `supabase/templates` | Needs a Resend key and verified domain |

## NSE market data

**What NSE offers (official pages).** NSE has no public REST API. Market data is sold by NSE Data & Analytics as
licensed products:
- a real-time data feed in **multicast** format (L1/L2 and tick-by-tick), by leased line or through an authorised vendor;
- **1-minute and 5-minute snapshot** files;
- **15-minute delayed snapshot** files, generated every minute on NSE's internet information server;
- paid end-of-day and historical data, and paid master (security) data.

Each product has its own PDF technical specification and tariff. Sources:
[real-time data](https://www.nseindia.com/static/market-data/real-time-data-subscription) ·
[EOD/historical](https://www.nseindia.com/static/market-data/eod-historical-data-subscription) ·
[master data](https://www.nseindia.com/static/market-data/paid-master-data) ·
[data sharing & usage policy](https://www.nseindia.com/static/market-data/nse-data-policy).

**Licence points that affect INRGIFT.**
- Access to data is not a right to display or redistribute it. Redistribution is allowed only as the licence
  agreement states. Delayed and snapshot charges depend on the display medium (website, app).
- Building derived indices from NSE data needs a separate licence. NSE keeps audit rights.
- NSE covers NSE-listed Indian instruments only. Other markets on INRGIFT stay demo or unavailable until each is
  licensed. No other vendor is substituted.

**Questions to settle with NSE Data & Analytics before go-live.**
1. Which product: real-time, 1/5-minute snapshot, 15-minute delayed or EOD only?
2. Is public display on a free website and app covered? Which attribution and delay labels are required?
3. Is a reporting or audit tool required? Are per-user counts or display limits enforced?
4. Which segments are covered (CM, F&O, indices)? Is the security master included?
5. Delivery method and credentials (SFTP account, vendor API, leased line), and the specification version.

**Architecture.** NSE (or an authorised vendor) → `NseSource` (server only) → `NSEMarketDataProvider`
(normalisation, candle validation, `DataMeta` with exchange time, IST and an honest LIVE/DELAYED/CLOSED status) →
fallback cache → services → `/api/v1` → browser. The browser never contacts NSE. No NSE key may use
`NEXT_PUBLIC_*`.

The requested capability set (`searchSymbols`, `getSecurity`, `getQuote`, `getHistoricalData`,
`getIntradayData`, `getMarketStatus`, `getExchangeInfo`, `subscribeRealtime`) is the `NseSource` interface. Until a
product is licensed, `UnconnectedNseSource` fails every call with `NOT_CONFIGURED`. No endpoint, field name or
credential has been invented.

To finish:
1. Implement `NseSource` against the licensed specification.
2. Load the security master into `market.instruments` / `market.listings` (`source_id='nse'`).
3. Implement `NseInstrumentMap` over those tables.
4. Add the product's server-only env vars to `.env.example`.
5. Set `MARKET_DATA_PROVIDER=nse`.

`subscribeRealtime` needs a long-running worker. It cannot run inside a serverless request.

**Status:** NSE integration could not be live-tested because credentials/access were not available.

## Supabase

- **Clients:** one browser client (`src/supabase/client.ts`) and one cookie-bound server client
  (`src/supabase/server.ts`).
- **Middleware:** `src/middleware.ts` refreshes the session and guards private routes with `auth.getClaims()`. It
  passes the refreshed cookies and cache headers onto redirects.
- **Keys:** the publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) is preferred; the legacy anon key still
  works. No service-role key is used anywhere in the app.
- **Tables:**
  - `public.profiles` is linked 1:1 to `auth.users`. It is created by the `on_auth_user_created` trigger.
  - `profiles.phone_verified` is owned by the server: it mirrors `auth.users.phone_confirmed_at` (migration 0005), and
    client roles cannot change it.
  - Every private table has owner-only RLS, and `user_id` defaults to `auth.uid()`.
- **Verification:** `npm run test:db` applies every migration to a throwaway local Postgres with a minimal `auth`
  shim, then runs `supabase/tests/rls.test.sql`. That covers cross-user reads and writes, spoofed owners, ownership
  reassignment, anon access, the insert-only support table and the verification flag.
- **Storage:** no buckets, because nothing is uploaded. If uploads are added, use private buckets with
  owner-scoped `storage.objects` policies. Never store credentials in Storage.

**Dashboard settings still to set** (needs the project):
- Site URL, and the redirect URLs `/auth/callback` and `/auth/confirm`.
- Email confirmation on.
- The two email templates from `supabase/templates`.
- Custom SMTP (below).
- An SMS provider for phone OTP. India SMS needs TRAI DLT registration.
- TOTP MFA on.
- CAPTCHA (optional; see Anti-abuse).
- Auth rate limits.

## Email: Resend through Supabase SMTP

Supabase's built-in mailer is for testing only. It sends about 2 emails an hour, so production needs custom SMTP.
Steps ([Resend guide](https://resend.com/docs/send-with-supabase-smtp)):
1. Verify the sending domain in Resend: add its DKIM/SPF (and recommended DMARC) records at the DNS host.
2. Create a Resend API key with sending access only.
3. In Supabase → Authentication → Emails → SMTP settings, enter host `smtp.resend.com`, port `465`, username
   `resend`, the API key as password, and a sender such as `no-reply@<domain>` named "INRGIFT".

Alternatively, Resend's Supabase integration fills these settings in automatically. The app sends no email itself,
so no Resend key belongs in this repository.

## Logos

Stock/ETF logos are shown only for stocks, ETFs, REITs and funds on exchanges whose Logo.dev ticker suffix is
documented. Every other case, and any failed request, shows the ticker tile. The e2e suite stubs the CDN and asserts
that no broken image remains.

Logo.dev's publishable key is meant for browser use ([docs](https://www.logo.dev/docs/introduction),
[repo](https://github.com/logo-dev/logo-api)). Restrict it to the production domain in the Logo.dev dashboard. The
secret key is not used.

Images load from Logo.dev's CDN and are not proxied or stored. The free plan requires the "Logos provided by
Logo.dev" link, which the footer shows whenever the provider is on. Plan limits and commercial terms for the paid
tiers: **unverified**.

**INRGIFT's own logo:** no official brand files are in the repository. The header mark, `src/app/icon.svg` and the
OG image are interim placeholders built from the existing CSS mark, not official branding. Email templates use a
plain-text wordmark.

## GoDaddy

Nothing in the repository says whether GoDaddy is only the registrar/DNS host or also the web host. Both are
possible:
- **GoDaddy as DNS only, hosted elsewhere:** point an `A` record (apex) and a `CNAME` (`www`) at the host the
  hosting provider names, and add Resend's DKIM/SPF/DMARC records.
- **GoDaddy hosting:** GoDaddy sells Node.js-capable hosting. Whether a given plan runs `next start` with
  middleware is **unverified**. It needs Node 18.18+, a persistent process and outbound HTTPS to Supabase.

No DNS record has been changed.

## Anti-abuse (optional)

- **Already in place:** the contact form has a honeypot and a per-IP rate limit. `/api/v1` is rate limited.
- **Known limits:**
  - Both rate limits are in memory, so they apply per server instance.
  - The client IP comes from `x-forwarded-for`, which is trustworthy only behind a proxy that overwrites it.
- **Recommended:** Supabase Auth CAPTCHA (hCaptcha or Cloudflare Turnstile) on signup, login and password reset.
  It needs a site key and secret, and has not been added.
