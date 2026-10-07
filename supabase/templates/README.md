# Auth email templates

> **Primary path (7 Oct 2026):** auth emails are rendered by INRGIFT (`src/services/email/templates.ts`) and delivered
> through **Resend** via the Supabase **Send Email Hook** (`/api/hooks/send-email`, `docs/CONNECTORS.md`). The HTML
> templates below are a fallback only if the hook is switched off; both link to `/auth/confirm`, which verifies the email,
> signs that link session out and sends the person to sign in with email + password, then SMS.

Paste these into **Supabase → Authentication → Email Templates** (or send them with the Management API,
`PATCH /v1/projects/{ref}/config/auth`, keys `mailer_templates_confirmation_content` / `mailer_templates_recovery_content`).

| File | Template | Subject | Lands on |
| --- | --- | --- | --- |
| `confirmation.html` | Confirm signup | Confirm your email for INRGIFT | `/auth/confirm` → `/login` (then SMS on `/verify-phone`) |
| `recovery.html` | Reset password | Reset your INRGIFT password | `/auth/confirm` → `/reset-password` |

Links use `{{ .TokenHash }}` and `/auth/confirm`, which verifies the token on the server. That works when the email is
opened on another device. With Supabase's default templates the link carries a PKCE `code` to `/auth/callback`
instead, which works only in the browser that started the flow; both routes are kept.

Set **Site URL** to the production origin and add `https://<domain>/auth/confirm**` and `https://<domain>/auth/callback**`
to **Redirect URLs** (the `**` allows the `next` return path).

The header is the official horizontal logo PNG (`public/brand/email/…@2x.png`, shown at 220 px wide, its minimum),
loaded from `{{ .SiteURL }}`, so the Site URL must be the live production origin. Do not substitute another image.
