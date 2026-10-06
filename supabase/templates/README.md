# Auth email templates

Paste these into **Supabase → Authentication → Email Templates** (or send them with the Management API,
`PATCH /v1/projects/{ref}/config/auth`, keys `mailer_templates_confirmation_content` / `mailer_templates_recovery_content`).

| File | Template | Subject | Lands on |
| --- | --- | --- | --- |
| `confirmation.html` | Confirm signup | Confirm your email for INRGIFT | `/auth/confirm` → `/verify-phone` |
| `recovery.html` | Reset password | Reset your INRGIFT password | `/auth/confirm` → `/reset-password` |

Links use `{{ .TokenHash }}` and `/auth/confirm`, which verifies the token on the server. That works when the email is
opened on another device. With Supabase's default templates the link carries a PKCE `code` to `/auth/callback`
instead, which works only in the browser that started the flow; both routes are kept.

Set **Site URL** to the production origin and add `https://<domain>/auth/confirm` and `https://<domain>/auth/callback`
to **Redirect URLs**. Emails are sent through custom SMTP (Resend); see `docs/CONNECTORS.md`.

The header is a plain-text wordmark. Replace it with the official INRGIFT logo (hosted on the production domain)
once the brand files are supplied. Do not substitute another image.
