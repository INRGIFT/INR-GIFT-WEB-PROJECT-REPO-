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
| Authentication | Supabase Auth (`@supabase/ssr` 0.12) | Email + password identity, sessions, email confirmation, reset; verified phone recorded on `auth.users` by the server; homepage-only access gate | Project connected; migration 0007, Site URL/redirects and the Send Email Hook still to set |
| SMS (phone verification and second factor) | **2Factor.in** | `src/services/providers/twofactor.ts` (AUTOGEN/VERIFY), `/api/auth/sms/*` | Needs `TWO_FACTOR_API_KEY` (+ DLT-approved OTP template) |
| News | **NewsData.io** (the "News IO" key) | `src/services/news/*`, `/resources/news`, `/api/v1/news/feed` | Needs `NEWSIO_API_KEY`; demo headlines until then |
| Storage | Supabase Storage | Not used: no upload feature exists, so no buckets | n/a |
| Stock/ETF logos | Logo.dev (replaceable) | `src/lib/logos` + `AssetLogo` with ticker-tile fallback | Publishable key supplied (in `.env.local`, gitignored; set it on the host) |
| Email | **Resend** through the Supabase Send Email Hook | `src/services/providers/resend.ts`, `src/services/email/*`, `/api/hooks/send-email` | Needs `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, a verified domain and `SEND_EMAIL_HOOK_SECRET` |

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
- **Keys:** the publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) in the browser; the **secret key**
  (`SUPABASE_SECRET_KEY`, or legacy `SUPABASE_SERVICE_ROLE_KEY`) only in route handlers (`src/supabase/admin.ts`) to
  record a verified phone and write the SMS tables. Never in client code, middleware, logs or the deployment zip.
- **Tables:**
  - `public.profiles` is linked 1:1 to `auth.users`. It is created by the `on_auth_user_created` trigger.
  - Migration 0007 removes `profiles.phone_verified`; the verified phone lives on `auth.users`. It adds
    `account_phones` (unique numbers), `sms_challenges`, `sms_step_ups` (server-written) and a restrictive RLS policy
    on every workspace table (password session + confirmed email and phone + SMS for this session).
  - Every private table has owner-only RLS, and `user_id` defaults to `auth.uid()`.
- **Verification:** `npm run test:db` applies every migration to a throwaway local Postgres with a minimal `auth`
  shim, then runs `supabase/tests/rls.test.sql`. That covers cross-user reads and writes, spoofed owners, ownership
  reassignment, anon access, the insert-only support table and the verification flag.
- **Storage:** no buckets, because nothing is uploaded. If uploads are added, use private buckets with
  owner-scoped `storage.objects` policies. Never store credentials in Storage.

**Dashboard settings still to set** (needs the project):
- Migration 0007 (`supabase/migrations/0007_required_credentials_sms.sql`): **not now**. Apply it only together with
  the SMS switch, after 2Factor.in DLT approval (`docs/AUTH-SECURITY.md`, "Switching SMS on").
- Site URL `https://inrgift.com`; redirect URLs `https://inrgift.com/auth/callback**` and
  `https://inrgift.com/auth/confirm**` (with `**` so the `next` return path is allowed).
- Email confirmation **on**. Email provider on; **Phone provider off** (SMS goes through INRGIFT + 2Factor.in);
  anonymous sign-ins off; no OAuth providers; MFA (TOTP/phone) **off** (INRGIFT refuses Supabase MFA factors).
- Authentication → Hooks → **Send Email**: HTTPS hook to `https://inrgift.com/api/hooks/send-email`; copy its secret
  (`v1,whsec_…`) into `SEND_EMAIL_HOOK_SECRET` on the host.
- Project Settings → API keys: create a **secret key** for `SUPABASE_SECRET_KEY` (server only).
- CAPTCHA (optional; see Anti-abuse) and Auth rate limits.

## Email: Resend (Send Email Hook)

Supabase generates every auth token; INRGIFT renders the email and Resend delivers it:
Supabase → `POST /api/hooks/send-email` (Standard Webhooks signature checked with `SEND_EMAIL_HOOK_SECRET`) →
`src/services/email` → `POST https://api.resend.com/emails` (`Authorization: Bearer RESEND_API_KEY`).
Handled types: `signup` (link to `/auth/confirm?type=signup`), `recovery` (`/auth/confirm?type=recovery`),
`reauthentication` (code). `magiclink`, `invite` and `email_change` are refused (422): INRGIFT has no passwordless
sign-in, and email changes go through support. Security notices (phone changed, password changed) are sent by the
server through the same adapter. Sending an email never marks anything verified; Supabase does. Links in every
email are built from `NEXT_PUBLIC_SITE_URL` (`https://inrgift.com`), never from the hook payload's `site_url`.
Setup: verify the sending domain in Resend (SPF/DKIM, DMARC recommended), create a sending-only API key, set
`RESEND_API_KEY` and `RESEND_FROM_EMAIL` (e.g. `INRGIFT <no-reply@<domain>>`) on the host, then enable the hook in
Supabase. (Resend's Supabase SMTP integration is an alternative only for Supabase's own templates; INRGIFT uses the
hook so all mail goes through one adapter.)

## Google sign-in (Supabase OAuth)

Browser → `supabase.auth.signInWithOAuth({ provider: 'google' })` (PKCE, S256; the code verifier is a Supabase
cookie) → Google → `https://odiflbsoitgktylaksng.supabase.co/auth/v1/callback` → `https://inrgift.com/auth/callback?flow=oauth&next=…`
→ server exchanges the code for the session (cookies) → destination. A first Google sign-in completes the account
model on `/complete-profile` (mobile number, password, country, terms; written by `/api/auth/complete-profile` with the
secret key into `app_metadata`). Accounts with the same verified email are linked by Supabase's automatic identity
linking, which first removes unconfirmed identities (pre-account-takeover protection). The button appears only when
Supabase reports the Google provider enabled (`/auth/v1/settings`); setup steps are in `docs/DEPLOY.md`.

## SMS: 2Factor.in

Browser → `/api/auth/sms/start|verify` → `src/services/auth/sms-verification.ts` → `src/services/providers/twofactor.ts`
→ 2Factor.in. Endpoints (2Factor API reference): `GET https://2factor.in/API/V1/{key}/SMS/{phone}/AUTOGEN/{template}`
(returns an OTP session id, not the code) and `GET …/SMS/VERIFY/{session_id}/{otp}` ("OTP Matched" / "OTP Mismatch" /
"OTP Expired"). Setup: `TWO_FACTOR_API_KEY`; `TWO_FACTOR_OTP_TEMPLATE` = the OTP template name approved for INRGIFT
(Indian SMS needs TRAI DLT sender and template registration through 2Factor); optionally restrict the key to the
server's IP in the 2Factor dashboard. **Status: not active.** DLT approval is pending, so
`NEXT_PUBLIC_SMS_SECOND_FACTOR` stays off and no code path calls 2Factor.in until it is switched on.

## News: NewsData.io ("News IO")

`GET https://newsdata.io/api/1/latest` with header `X-ACCESS-KEY: NEWSIO_API_KEY` (documented alternative to the
`apikey` query parameter, so the key never appears in URLs). Parameters INRGIFT sends: `language=en`,
`removeduplicate=1`, `size` (`NEWSIO_PAGE_SIZE`, default 10 for the free plan, max 50), `category`, `country` (≤5),
`q` (≤512), `timeframe` (1–48 h), `domain`, `page` (the previous `nextPage`). Errors 400/401/403/409/415/422/429/500
map to safe INRGIFT states. Free plan: 200 credits a day; the cache (`NEWSIO_CACHE_SECONDS`, default 900) protects
it. Attribution: source name, publish time and a link to the original on every card; INRGIFT shows headline and the
provider's short description only (no `full_content`). Details: `docs/CONTENT.md#news`.

## Manual production smoke test (real providers)
1. `/api/health` → `integrations` shows supabase.secretKey, resend.configured + sendEmailHook, twofactor.configured,
   news.provider `newsdata.io` (it sends nothing and spends no quota).
2. Sign up with a real inbox and phone → the Resend email arrives (check Resend logs) → the link lands on sign-in.
3. Sign in → an SMS from 2Factor.in arrives → a wrong code is refused → the right code opens the workspace.
4. Sign out, sign in → a new SMS is required. Reset the password → SMS required before saving.
5. `/resources/news` shows "Fresh from provider" or "Cached", source NewsData.io, and only market/business stories.
6. Search the client bundle and the deployment zip for the key values (none may appear).

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
