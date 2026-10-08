import { NextResponse, type NextRequest } from 'next/server';
import { config, EMAIL_OTP_LENGTH, emailOtpMinutes } from '@/lib/config';
import { safeReturnPath } from '@/lib/return-url';
import { configured, serverEnv } from '@/lib/server-env';
import { verifyStandardWebhook } from '@/lib/standard-webhooks';
import { log } from '@/lib/telemetry/log';
import { sendEmail } from '@/services/email/email-service';
import { recordOtpLength } from '@/services/email/otp-length';
import { emailTemplates, type RenderedEmail } from '@/services/email/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HookPayload {
  user?: { email?: string; new_email?: string };
  email_data?: { token?: string; token_hash?: string; token_new?: string; token_hash_new?: string; email_action_type?: string; site_url?: string; redirect_to?: string; old_email?: string; provider?: string; factor_type?: string };
}
const fail = (status: number, message: string) => NextResponse.json({ error: { http_code: status, message } }, { status });
/** Security notifications Supabase can send (Authentication → Notifications). Each becomes a branded INRGIFT notice. */
const NOTIFICATIONS = ['password_changed_notification', 'email_changed_notification', 'phone_changed_notification', 'identity_linked_notification', 'identity_unlinked_notification', 'mfa_factor_enrolled_notification', 'mfa_factor_unenrolled_notification'] as const;
type Notification = (typeof NOTIFICATIONS)[number];

/**
 * Supabase Auth "Send Email" hook (Authentication → Hooks). With the hook enabled, Supabase never sends an auth email
 * itself: it generates the token and calls this endpoint with a Standard Webhooks signature; INRGIFT renders the email
 * and delivers it through Resend from the configured sender (INRGIFT Support <support@inrgift.com>). Supabase stays the
 * source of truth: the sign-up email carries Supabase's six-digit code (checked by Supabase verifyOtp); reset and
 * email-change links go to /auth/confirm, which verifies the token hash with Supabase on the server.
 *
 * Handled: signup, recovery, email_change (one or two emails, see below), reauthentication, and every security
 * notification. Refused (422, nothing sent): magiclink, invite and email (passwordless OTP sign-in), because every
 * INRGIFT session starts with the password, Google or Apple, and accounts are never created by invitation.
 */
export async function POST(req: NextRequest) {
  if (!configured.emailHook()) return fail(503, 'Email hook is not configured.');
  const body = await req.text();
  if (!verifyStandardWebhook(serverEnv.sendEmailHookSecret(), req.headers, body)) return fail(401, 'Invalid signature.');
  let p: HookPayload;
  try { p = JSON.parse(body) as HookPayload; } catch { return fail(400, 'Malformed payload.'); }
  const to = p.user?.email, d = p.email_data ?? {}, type = d.email_action_type;
  if (!to || !type) return fail(400, 'Malformed payload.');
  // INRGIFT's own origin (https://inrgift.com in production, src/lib/config.ts); never taken from the payload.
  const site = config.siteUrl.replace(/\/$/, '');
  // The return path chosen at sign-up rides along (validated again by /auth/confirm); nothing else from redirect_to is used.
  let next = '';
  try { next = safeReturnPath(new URL(d.redirect_to ?? '', 'https://x.invalid').searchParams.get('next'), ''); } catch { /* none */ }
  const link = (hash: string | undefined, kind: string) => `${site}/auth/confirm?token_hash=${encodeURIComponent(hash ?? '')}&type=${kind}${next ? `&next=${encodeURIComponent(next)}` : ''}`;
  const out: { to: string; mail: RenderedEmail }[] = [];
  // A code the INRGIFT screen cannot take is never sent: Supabase's token is delivered exactly as generated or not at
  // all (never cut or padded). The digit count, never the code, is logged and shown on /api/health. Fix: Supabase →
  // Authentication → Sign In / Providers → Email → Email OTP Length = 6.
  if ((type === 'signup' || type === 'reauthentication') && d.token && /^\d+$/.test(d.token)) {
    recordOtpLength(d.token.length);
    if (d.token.length !== EMAIL_OTP_LENGTH) {
      log('error', 'email_otp_length_mismatch', { type, expected: EMAIL_OTP_LENGTH, actual: d.token.length });
      return fail(500, `Email code length is ${d.token.length}; INRGIFT requires ${EMAIL_OTP_LENGTH}. Set Supabase Email OTP Length to ${EMAIL_OTP_LENGTH}.`);
    }
  }
  switch (type) {
    // Sign-up: the six-digit code Supabase generated for this request (verifyOtp, type 'email'). Never logged or stored.
    case 'signup': out.push({ to, mail: d.token && /^\d+$/.test(d.token) ? emailTemplates.verifySignupCode(d.token, emailOtpMinutes) : emailTemplates.confirmSignup(link(d.token_hash, 'signup')) }); break;
    case 'recovery': out.push({ to, mail: emailTemplates.resetPassword(link(d.token_hash, 'recovery')) }); break;
    case 'reauthentication': if (!d.token) return fail(400, 'Malformed payload.'); out.push({ to, mail: emailTemplates.reauthenticate(d.token) }); break;
    case 'email_change': {
      // Supabase's field names are reversed for backward compatibility (Send Email Hook docs, "Email change behavior"):
      //   token_hash_new goes with the CURRENT address (user.email); token_hash goes with the NEW address (user.new_email).
      // Secure email change on: both hashes arrive and both addresses must confirm. Off: one email, to the new address.
      const newEmail = p.user?.new_email;
      if (!newEmail || !d.token_hash) return fail(400, 'Malformed payload.');
      if (d.token_hash_new) out.push({ to, mail: emailTemplates.confirmEmailChangeFromCurrent(link(d.token_hash_new, 'email_change'), newEmail) });
      out.push({ to: newEmail, mail: emailTemplates.confirmEmailChange(link(d.token_hash, 'email_change')) });
      break;
    }
    default:
      if ((NOTIFICATIONS as readonly string[]).includes(type)) { out.push({ to, mail: emailTemplates.securityNotice(type as Notification, { oldEmail: d.old_email, provider: d.provider }) }); break; }
      log('warn', 'email_hook_refused', { type });
      return fail(422, 'This email type is not used by INRGIFT.');
  }
  for (const m of out) {
    const r = await sendEmail(m.to, m.mail, type);
    if (!r.ok) return fail(502, 'Email could not be sent.');
  }
  log('info', 'email_hook_sent', { type, count: out.length });
  return NextResponse.json({});
}
