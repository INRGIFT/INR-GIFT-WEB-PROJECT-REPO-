import { NextResponse, type NextRequest } from 'next/server';
import { config } from '@/lib/config';
import { safeReturnPath } from '@/lib/return-url';
import { configured, serverEnv } from '@/lib/server-env';
import { verifyStandardWebhook } from '@/lib/standard-webhooks';
import { log } from '@/lib/telemetry/log';
import { sendEmail } from '@/services/email/email-service';
import { emailTemplates } from '@/services/email/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HookPayload {
  user?: { email?: string };
  email_data?: { token?: string; token_hash?: string; email_action_type?: string; site_url?: string; redirect_to?: string };
}
const fail = (status: number, message: string) => NextResponse.json({ error: { http_code: status, message } }, { status });

/**
 * Supabase Auth "Send Email" hook (Authentication → Hooks). Supabase generates the token and calls this endpoint with
 * a Standard Webhooks signature; INRGIFT renders the email and delivers it through Resend. Supabase stays the source
 * of truth: the link goes to /auth/confirm, which verifies the token with Supabase. Passwordless types (magic link,
 * invite) are refused, because every INRGIFT session must start with email + password.
 */
export async function POST(req: NextRequest) {
  if (!configured.emailHook()) return fail(503, 'Email hook is not configured.');
  const body = await req.text();
  if (!verifyStandardWebhook(serverEnv.sendEmailHookSecret(), req.headers, body)) return fail(401, 'Invalid signature.');
  let p: HookPayload;
  try { p = JSON.parse(body) as HookPayload; } catch { return fail(400, 'Malformed payload.'); }
  const to = p.user?.email, d = p.email_data ?? {};
  if (!to || !d.email_action_type) return fail(400, 'Malformed payload.');
  // The configured site address wins; otherwise the Site URL set in Supabase (sent in the signed payload).
  const site = (process.env.NEXT_PUBLIC_SITE_URL ? config.siteUrl : d.site_url ?? config.siteUrl).replace(/\/$/, '');
  // The return path chosen at sign-up rides along (validated again by /auth/confirm); nothing else from redirect_to is used.
  let next = '';
  try { next = safeReturnPath(new URL(d.redirect_to ?? '', 'https://x.invalid').searchParams.get('next'), ''); } catch { /* none */ }
  const link = (type: string) => `${site}/auth/confirm?token_hash=${encodeURIComponent(d.token_hash ?? '')}&type=${type}${next ? `&next=${encodeURIComponent(next)}` : ''}`;
  let mail;
  switch (d.email_action_type) {
    case 'signup': mail = emailTemplates.confirmSignup(link('signup')); break;
    case 'recovery': mail = emailTemplates.resetPassword(link('recovery')); break;
    case 'reauthentication': if (!d.token) return fail(400, 'Malformed payload.'); mail = emailTemplates.reauthenticate(d.token); break;
    default:
      log('warn', 'email_hook_refused', { type: d.email_action_type });
      return fail(422, 'This email type is not used by INRGIFT.');
  }
  const r = await sendEmail(to, mail, d.email_action_type);
  if (!r.ok) return fail(502, 'Email could not be sent.');
  return NextResponse.json({});
}
