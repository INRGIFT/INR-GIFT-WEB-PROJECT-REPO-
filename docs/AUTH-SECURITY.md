# Auth and security

## Modes
- **Supabase** when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are set.
- **Demo** otherwise: browser-local user, any email/password, code `123456`, five wrong codes lock for 60 s,
  session cookie `inrgift_demo_session`. For development only.

Both implement `AuthAdapter` in `src/features/auth/auth-service.ts`; forms must use `useSession().auth` and nothing else.

## Flows (pages built in `src/app/(auth)`, forms in `src/features/auth/forms.tsx`)
Sign up: email + password → email verification (`/auth/confirm` verifies `token_hash` from the INRGIFT templates in
`supabase/templates`, working across devices; `/auth/callback` exchanges a PKCE code from the default templates) → phone OTP → TOTP enrolment →
onboarding → workspace.
Login: email + password **or** phone OTP → MFA challenge when the account has a verified factor (AAL2) → workspace.
Recovery: forgot password → emailed link → `/auth/confirm?type=recovery&next=/reset-password` (or `/auth/callback`) → new password.
Phone verification state is owned by Supabase Auth: `profiles.phone_verified` mirrors `auth.users.phone_confirmed_at`
through a trigger (migration 0005) and client roles cannot change it.

Adapter methods: getUser, onChange, signUp, signIn, confirmEmail (demo), resendEmail, sendPhoneOtp, verifyPhoneOtp,
resetPassword, updatePassword, mfaEnroll, mfaVerify, mfaFactorId, mfaUnenroll, updateName, activity, signOut.
Helpers: `passwordProblem` (≥10 chars, a number, a symbol), `isEmail`, `isPhone` (E.164), `normalizePhone`.
Errors are mapped to `AuthError` codes: INVALID, RATE_LIMITED, EXPIRED, WEAK_PASSWORD, UNKNOWN.

## Pages
Built: `/login` `/signup` `/verify` `/verify-phone` `/mfa` (`?mode=enrol|challenge`) `/forgot-password`
`/reset-password` `/onboarding`, `/account/profile` `/account/settings` `/account/security` (email verified, phone verified, TOTP status, MFA status, current session, security activity).
Required UI states: resend cooldown, rate-limited, expired link/code, invalid, loading; masked email on `/verify`.
Supabase cannot list all sessions from the client; show the current session and activity, and say so.

## Session and route protection
`src/middleware.ts` refreshes the Supabase cookie on every request, verifies the JWT with `getClaims()` (never trust
`getSession()` server-side), carries refreshed cookies and cache headers onto redirects, redirects unauthenticated requests for `/app`, `/account`, `/notifications`,
`/onboarding` to `/login?next=…`, and sets `noindex` + `no-store` on private routes.

## Data security
- RLS on every private table, forced, and tested: `npm run test:db` runs `supabase/tests/rls.test.sql` on a local
  Postgres after all migrations (cross-user read/write, spoofed owner, owner reassignment, anon, verification flag); ownership set by the database; child rows verified against parent owner.
- Client never sends `user_id`; `supabaseRepo.update` strips it.
- No service-role key is used today. Provider keys are server-only env vars; only `/api/internal/*` may use a
  service-role key when ingestion persistence is built. The only `NEXT_PUBLIC_*` keys are browser-safe by design
  (Supabase publishable/anon, Logo.dev `pk_`).
- Ingest route compares the secret with `timingSafeEqual`.
- All API query input is zod-validated; screener share links are sanitised on decode (`decodeTree`).
- `next` redirect targets are restricted to same-origin paths (`safeNext`, unit-tested).
- Auth routes send `X-Robots-Tag: noindex`; contact form is rate limited and has a honeypot.
- Security headers in `next.config.mjs` (nosniff, frame deny, referrer policy, permissions policy, HSTS, Content-Security-Policy with `frame-ancestors 'none'` and an allow-list for Supabase and Logo.dev).

## Not done
CSP nonce (CSP is set but allows `'unsafe-inline'`) · distributed rate limiting (current limiter is per-instance memory) · rate limiting on auth forms beyond
Supabase's own · Supabase project configuration (SMS provider, email templates, custom SMTP, MFA enabled, CAPTCHA) · any test
against a real Supabase project (RLS is verified on local Postgres only) · legal review of auth copy.
