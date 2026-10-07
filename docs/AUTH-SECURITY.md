# Auth, access and security

## Providers (do not substitute)
| Provider | Role | Where |
| --- | --- | --- |
| **Supabase Auth** | Identity, email + password, Google OAuth, sessions, email confirmation, password reset, the verified phone on `auth.users` | `@supabase/ssr`, `src/supabase/*` |
| **Resend** | Every transactional email: sign-up confirmation, password reset, re-authentication code, security notices | `src/services/providers/resend.ts`, `src/services/email/*`, Supabase **Send Email Hook** → `/api/hooks/send-email` |
| **2Factor.in** | SMS codes: phone verification and the second factor at every sign-in, password reset and number change | `src/services/providers/twofactor.ts`, `src/services/auth/*`, `/api/auth/sms/*` |

Supabase MFA factors and Supabase's own SMS provider are **not** used (migration 0007 refuses any MFA factor).

## Account model
Every account has three credentials: **email**, **mobile number** and **password**. **Google** is an additional way to
sign in, not a replacement: a first Google sign-in must add the mobile number, a password, country and acceptance of
the Terms and Privacy Policy on `/complete-profile` before anything opens (gate step `profile`). The password and the
terms acceptance are written by the server with the secret key into `app_metadata.inrgift` (the person cannot edit
it), so the step cannot be skipped from the browser. No passwordless sign-in, no other social login, no phone-only or
email-only accounts, no "skip".

**SMS switch (`NEXT_PUBLIC_SMS_SECOND_FACTOR`, `src/lib/config.ts`). Off by default and off in production today**,
because 2Factor.in DLT approval is pending and migration 0007 is not applied. While off: the gate is facts 1–3 below
(signed in, email confirmed, password session); sign-up still requires the mobile number (stored in the user's
metadata, not yet verified or unique); no request ever calls 2Factor.in; the SMS routes answer "not configured";
Security shows "SMS two-factor: Not yet active"; nothing reads the 0007 tables. Supabase Phone Auth and Supabase MFA
stay off either way. When on, all five facts are required:
1. signed in (Supabase session) · 2. email confirmed (`auth.users.email_confirmed_at`) · 3. the session was opened with
the password (JWT `amr` contains `password`) · 4. phone verified (`auth.users.phone_confirmed_at`, written only by
INRGIFT's server after 2Factor.in matched a code) · 5. **this session** passed an SMS code (`public.sms_step_ups` row
for the JWT `session_id`, server-written).
The database enforces the same rule with a restrictive RLS policy on every workspace table
(`session_fully_verified()`, migration 0007). No localStorage, cookie or client boolean decides anything in production.

## Flows
- **Sign-up** (`/signup`): name, email, mobile number (E.164), password, confirmation, terms. Server checks number
  availability (`/api/auth/phone-available`, rate-limited); Supabase creates the user; a database trigger reserves the
  number (unique). Supabase calls the Send Email Hook → Resend sends the confirmation link → `/auth/confirm` verifies
  the token **and signs that link session out** → `/login` (email + password) → `/verify-phone`: 2Factor.in sends a
  code → server checks it → `auth.users.phone` confirmed + SMS step-up for this session → onboarding → the original
  destination (`next`).
- **Sign-in** (`/login`): email + password (Supabase) → `/verify-phone` sends the code automatically → match → session
  step-up → destination. A wrong code leaves the session blocked; five wrong codes lock the challenge.
- **Password reset**: `/forgot-password` → Resend email → `/auth/confirm?type=recovery` → `/reset-password` asks for an
  SMS code first (when a phone is verified) → `POST /api/auth/password` (server checks the SMS step-up) → all other
  sessions signed out → sign in again with the new password + SMS. A recovery session never opens product pages
  (no `password` in `amr`), and a reset never disables SMS.
- **Change number** (`/verify-phone?mode=change`, from Security): needs a fully verified session; code sent to the
  new number; the number changes only after it matches; Resend sends a notice. The old number is released.
- **Lost phone** (SMS on only): `/support` (public) or support@inrgift.com. Support confirms identity out of band, then removes the phone
  with the Supabase dashboard/admin API; the person signs in with email + password and verifies a new number.
- **Security page** (`/account/security`): email Verified/Pending, phone Verified/Pending, password Configured, SMS
  two-factor Enabled (cannot be turned off), change number, change password, reset link, sign out.
- With the SMS switch off, the flows above stop after email + password: sign-up → emailed link → sign in → onboarding
  → destination; reset → emailed link → new password → sign in. The steps marked SMS are skipped, never faked.

## Switching SMS on (after 2Factor.in DLT approval)
Do these together, in order; 0007 and the switch belong together, because 0007's RLS requires an SMS step-up on every
workspace table and the app only writes step-ups when the switch is on.
1. In GoDaddy: `TWO_FACTOR_API_KEY`, `TWO_FACTOR_OTP_TEMPLATE` (the DLT-approved template) and `SUPABASE_SECRET_KEY`.
2. Check that no two existing accounts share a mobile number (0007 reserves numbers uniquely and fails on duplicates).
3. Apply `supabase/migrations/0007_required_credentials_sms.sql` to the live project (verified locally by `npm run test:db`).
4. Set `NEXT_PUBLIC_SMS_SECOND_FACTOR=on` in GoDaddy and rebuild (it is compiled in at build time).
5. Smoke test: `/api/health` shows `twofactor: { configured: true, secondFactor: "on" }`; sign in → SMS code arrives →
   workspace opens; a wrong code keeps it closed. Existing accounts are asked to verify their number at next sign-in.

## SMS verification (server)
`src/services/auth/sms-verification.ts` (pure logic, unit-tested) with a Supabase store (`sms-store.ts`, secret key).
- 2Factor generates and checks codes (`AUTOGEN` / `VERIFY`); INRGIFT stores only the 2Factor session id. Codes are
  never stored, logged or returned. The API key appears only in 2Factor's URL path and is never logged.
- A challenge is bound to the user **and** the Supabase session; another user's or session's id is "not found".
- Single use (atomic consume; replay → not found), expires after 10 minutes, five attempts, resend cooldown 30 s per
  session while a code is pending, at most five sends per account per 15 minutes, plus per-IP rate limits.
- The number for sign-in and reset always comes from `auth.users`, never from the request.

## Site access (homepage-only public)
`src/lib/route-registry.ts` classifies every path; `src/middleware.ts` enforces it for pages **and** `/api`:
| Class | Paths | Rule |
| --- | --- | --- |
| public | `/`, `/terms-and-conditions`, `/privacy-policy`, `/about`, `/support`, `/account-closure`, `/grievance-redressal`, `/legal`, `/legal/*` | open (compliance pages required by the NSEIXGA white-label documentation; no market data) |
| auth | `/login` `/signup` `/verify` `/verify-phone` `/complete-profile` `/mfa` `/forgot-password` `/reset-password` `/auth/callback` `/auth/confirm` | open |
| public-api | `/api/health`, `/api/auth/*`, `/api/hooks/*` (signed), `/api/internal/*` (secret), `/api/forms/*` (support, grievance, closure: validated, rate-limited) | each protects itself |
| file | robots, sitemap, icons, share image, `/brand` `/fonts` `/media` files | open, no product data |
| **protected** | **everything else** (default deny): markets, assets, discover, research, resources, search, pricing, FAQ, workspace, account, all `/api/v1/*` | fully verified session |

Anonymous page requests → `307 /login?next=<path+query>` (absolute on `NEXT_PUBLIC_SITE_URL` in production, so a
proxy never rewrites the host); signed in but unverified → the missing step (`/verify`,
`/verify-phone`). Anonymous API requests → `401 { error: { code: "UNAUTHENTICATED" } }`; unverified → `403
VERIFICATION_REQUIRED`. Protected responses are `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`; every
page renders dynamically (`export const dynamic = 'force-dynamic'` in the root layout), so nothing is served from a
static or shared cache. Prefetch requests hit the same middleware.

**Return URL**: one rule, `safeReturnPath` (`src/lib/return-url.ts`): internal paths only, query and hash kept;
absolute URLs, `//host`, backslashes, `javascript:`, control characters, auth pages and over-long values fall back to
`/app`. It carries `next` through sign-in, sign-up, the emailed link (via the hook and `/auth/confirm`), phone
verification and onboarding.

## Sessions and cookies
Supabase Auth is the only session authority: browser client `createBrowserClient` → Supabase session in cookies →
middleware `createServerClient` (validates with `getClaims()`, refreshes, copies refreshed cookies and their cache
headers onto every response including redirects) → route handlers `createServerClient` → RLS in the database. No
custom JWT, session id or login cookie exists.

| Cookie | Set by | Purpose | Attributes |
| --- | --- | --- | --- |
| `sb-<project>-auth-token` (may be split `.0`, `.1`) | @supabase/ssr (browser + server) | Supabase access + refresh token | Path=/, SameSite=Lax, **Secure** in HTTPS production, host-only, not HttpOnly (the official browser client must read it to refresh), lifetime from @supabase/ssr; ends at sign-out/revocation |
| `sb-<project>-auth-token-code-verifier` (+ flow variants) | @supabase/ssr | PKCE verifier for Google sign-in and emailed links | same attributes; short-lived |
| `inrgift_demo_session` | demo adapter only | demo/test builds only; never read in Supabase mode | Path=/, SameSite=Lax |

No analytics, advertising or preference cookies exist (preferences, recent searches and the analytics choice are in
localStorage; the pending SMS challenge reference is in sessionStorage and holds no code). Analytics is off unless the
person allows it and no vendor receives events, so no consent banner is needed beyond the existing analytics choice.
Tokens never appear in localStorage, sessionStorage, URLs, the DOM or logs (checked by tests and the production probe).
Demo auth can never run on the live site: with `NEXT_PUBLIC_SITE_URL=https://inrgift.com`, `NEXT_PUBLIC_AUTH_MODE=demo`
is ignored (`src/lib/config.ts`).

**Lifecycle.** Expired or revoked sessions fail `getClaims()`/`getUser()` → middleware redirects pages to `/login?next=`
and answers APIs 401. The session context (`session-context.tsx`) ignores stale answers, re-checks when a tab becomes
visible, follows Supabase auth events across tabs, and leaves a protected page for sign-in when the session ends
elsewhere. Sign-out: Supabase `signOut()` (local) or "Sign out on all devices" (`scope: 'global'`) on Security; the
pending-challenge reference is cleared. Protected responses and their redirects are `Cache-Control: private,
no-store`, so Back never shows cached protected pages. Password reset signs out every other session.

**Google OAuth.** `signInWithOAuth` with PKCE (S256) → Google → Supabase → `/auth/callback?flow=oauth` → server code
exchange (verifier cookie from the same browser, so a code from another browser fails) → destination through
`safeReturnPath`. Errors (cancelled, denied, provider disabled, bad or expired code) → `/login?error=oauth` with a
message. No Google secret exists outside Supabase.

**CSRF.** Middleware refuses any cross-site state-changing `/api` request (`Origin` from another host or
`Sec-Fetch-Site: cross-site`) before a handler runs; signed webhooks and the secret ingest endpoint are exempt. Session
cookies are SameSite=Lax. The public forms additionally check Origin, require JSON, cap the body at 16 KB, rate-limit
per connection, per email and globally, drop honeypot or too-fast submissions, and send only to the fixed support
inbox (reply-to = sender), so they cannot relay mail.

**Logging.** Server logs are structured JSON with event names and coarse fields only (kind, code, reference); never
tokens, codes, passwords, cookies or full emails/phones. Security events: `security_profile_completed`,
`security_password_changed`, `form_submitted` (with reference), `sms_verified`.

## Data security
- RLS on every private table, forced and tested (`npm run test:db`, `supabase/tests/rls.test.sql`).
- Client never sends `user_id`. The secret key is used only in route handlers (`src/supabase/admin.ts`) for
  `auth.users` phone confirmation and the SMS tables; never in client code or middleware.
- Server-only secrets: `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), `SEND_EMAIL_HOOK_SECRET`,
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TWO_FACTOR_API_KEY`, `TWO_FACTOR_OTP_TEMPLATE`, `NEWSIO_API_KEY`,
  `INGEST_SECRET` (`src/lib/server-env.ts` throws if imported in a browser). Only browser-safe keys use `NEXT_PUBLIC_*`.
- Production never falls back to demo auth: a production build without Supabase and without an explicit
  `NEXT_PUBLIC_AUTH_MODE=demo` runs with sign-in **off** (`authMode`, `src/lib/config.ts`). Demo mode (dev/tests) is a
  browser simulation of the same rules, not a security boundary.
- Security headers: nosniff, frame deny, referrer policy, permissions policy, HSTS, CSP (`frame-ancestors 'none'`;
  `img-src https:` for publisher images on news cards).

## Not done
CSP nonce · distributed rate limiting (in-memory per instance) · real-provider tests (Resend, 2Factor, Supabase on the
live project) · migration 0007 applied to the live project · legal review of auth copy.
