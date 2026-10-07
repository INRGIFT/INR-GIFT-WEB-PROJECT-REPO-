# Auth, access and security

## Providers (do not substitute)
| Provider | Role | Where |
| --- | --- | --- |
| **Supabase Auth** | Identity, email + password, sessions, email confirmation, password reset, the verified phone on `auth.users` | `@supabase/ssr`, `src/supabase/*` |
| **Resend** | Every transactional email: sign-up confirmation, password reset, re-authentication code, security notices | `src/services/providers/resend.ts`, `src/services/email/*`, Supabase **Send Email Hook** → `/api/hooks/send-email` |
| **2Factor.in** | SMS codes: phone verification and the second factor at every sign-in, password reset and number change | `src/services/providers/twofactor.ts`, `src/services/auth/*`, `/api/auth/sms/*` |

Supabase MFA factors and Supabase's own SMS provider are **not** used (migration 0007 refuses any MFA factor).

## Account model
Every account has three credentials: **email**, **mobile number** and **password**. No passwordless sign-in, no social
login, no phone-only or email-only accounts, no "skip".

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
- **Lost phone** (SMS on only): `/support?topic=lost-phone` (protected under homepage-only access, so the person
  writes to the support email address instead). Support confirms identity out of band, then removes the phone
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
| public | `/` | open (owner requirement: homepage only; legal, support and contact pages are protected too) |
| auth | `/login` `/signup` `/verify` `/verify-phone` `/mfa` `/forgot-password` `/reset-password` `/auth/callback` `/auth/confirm` | open |
| public-api | `/api/health`, `/api/auth/*`, `/api/hooks/*` (signed), `/api/internal/*` (secret) | each protects itself |
| file | robots, sitemap, icons, share image, `/brand` `/fonts` `/media` files | open, no product data |
| **protected** | **everything else** (default deny): markets, assets, discover, research, resources, search, legal, support, contact, about, pricing, FAQ, workspace, account, all `/api/v1/*`, `/api/contact` | fully verified session |

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
