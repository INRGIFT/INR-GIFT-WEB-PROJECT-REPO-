/**
 * Transactional email content. Plain, branded HTML plus a text part. Links point only at INRGIFT's own
 * /auth/confirm route, which verifies the token with Supabase on the server.
 */
import { emailOtpSeconds, lifetimeText, smsSecondFactor } from '@/lib/config';
import { ADDRESS_ONE_LINE, COMPANY } from '@/lib/company';

export interface RenderedEmail { subject: string; html: string; text: string }
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
/**
 * Every account email shares one INRGIFT frame: the name and both lines of the brand (GLOBAL MARKET INTELLIGENCE FROM
 * INDIA · INVEST BEYOND BORDERS) on top; support address, company address, the two official social profiles and the
 * research-only statement below. No third-party branding: the email comes from INRGIFT, delivered by Resend.
 * Colours are inline hex because email clients ignore stylesheets (brand primary #245BFE, secondary #071A33).
 */
const BRAND_HTML = `<p style="margin:0 0 2px;font-weight:700;font-size:20px;letter-spacing:.02em;color:#071A33">INRGIFT</p>
<p style="margin:0;font-size:11px;letter-spacing:.12em;color:#245BFE;font-weight:700">${esc(COMPANY.descriptor.toUpperCase())}</p>
<p style="margin:2px 0 22px;font-size:11px;letter-spacing:.12em;color:#5F6B84">${esc(COMPANY.tagline.toUpperCase())}</p>`;
const FOOT_HTML = `<hr style="border:none;border-top:1px solid #E6EAF2;margin:24px 0 14px">
<p style="font-size:12px;color:#5F6B84;margin:0 0 6px">Questions? Write to <a href="mailto:${COMPANY.supportEmail}" style="color:#245BFE">${COMPANY.supportEmail}</a>.</p>
<p style="font-size:11px;color:#5F6B84;margin:0 0 6px">${esc(ADDRESS_ONE_LINE)}</p>
<p style="font-size:11px;color:#5F6B84;margin:0 0 6px">${COMPANY.social.map((x) => `<a href="${esc(x.href)}" style="color:#245BFE;text-decoration:none">${esc(x.label)}</a>`).join(' &nbsp;·&nbsp; ')}</p>
<p style="font-size:11px;color:#5F6B84;margin:0">INRGIFT is a research and information platform. It is not a broker or an investment adviser.</p>`;
const BRAND_TEXT = `INRGIFT\n${COMPANY.descriptor.toUpperCase()}\n${COMPANY.tagline.toUpperCase()}`;
const FOOT_TEXT = `Questions? Write to ${COMPANY.supportEmail}.\n${ADDRESS_ONE_LINE}\n${COMPANY.social.map((x) => `${x.label}: ${x.href}`).join('\n')}\nINRGIFT is a research and information platform. It is not a broker or an investment adviser.`;
function frame(subject: string, inner: string, text: string): RenderedEmail {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head><body style="margin:0;background:#F5F7FB;font-family:Arial,Helvetica,sans-serif;color:#0B0E14">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px">
<tr><td>${BRAND_HTML}${inner}${FOOT_HTML}</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text: `${BRAND_TEXT}\n\n${text}\n\n${FOOT_TEXT}` };
}
function layout(title: string, lines: string[], action?: { label: string; href: string }, foot = 'If you did not request this, you can ignore this email.'): RenderedEmail {
  const inner = `<h1 style="font-size:20px;margin:0 0 12px;color:#071A33">${esc(title)}</h1>
${lines.map((l) => `<p style="font-size:14px;line-height:1.6;margin:0 0 12px">${esc(l)}</p>`).join('')}
${action ? `<p style="margin:20px 0"><a href="${esc(action.href)}" style="background:#245BFE;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block">${esc(action.label)}</a></p><p style="font-size:12px;color:#5F6B84;word-break:break-all">${esc(action.href)}</p>` : ''}
<p style="font-size:12px;color:#5F6B84;margin:20px 0 0">${esc(foot)}</p>`;
  return frame(title, inner, `${title}\n\n${lines.join('\n\n')}${action ? `\n\n${action.label}: ${action.href}` : ''}\n\n${foot}`);
}
/**
 * A support, grievance or account-closure submission for the support inbox. Every value is escaped; multi-line text
 * keeps its line breaks. The subject is fixed by INRGIFT plus cleaned single-line input (no header injection).
 */
export function formSubmission(subject: string, title: string, rows: [label: string, value: string][]): RenderedEmail {
  const cell = 'padding:6px 10px;border-bottom:1px solid #E6EAF2;font-size:13px;vertical-align:top';
  const html = `<!doctype html><html><body style="margin:0;background:#F5F7FB;font-family:Arial,Helvetica,sans-serif;color:#0B0E14">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:640px;background:#ffffff;border-radius:12px;padding:24px">
<tr><td><p style="margin:0 0 4px;font-weight:700;font-size:16px;color:#071A33">INRGIFT</p><h1 style="font-size:18px;margin:8px 0 14px">${esc(title)}</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><th align="left" style="${cell};width:34%;color:#5F6B84;font-weight:600">${esc(k)}</th><td style="${cell};white-space:pre-wrap;word-break:break-word">${esc(v)}</td></tr>`).join('')}</table>
<p style="font-size:11px;color:#5F6B84;margin:16px 0 0">Submitted through ${esc('https://inrgift.com')}. Reply to this email to answer the sender.</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${title}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}`;
  return { subject, html, text };
}
/**
 * A one-time code email. The code is the one Supabase Auth generated for this request (the Send Email Hook passes it
 * as `token`); INRGIFT never creates, stores or logs it. Plain digits, shown large and spaced by CSS only, so copying
 * it gives exactly the six digits.
 */
function codeEmail(subject: string, intro: string, code: string, after: string[]): RenderedEmail {
  const digits = code.replace(/\D/g, '');
  const inner = `<h1 style="font-size:20px;margin:0 0 12px;color:#071A33">${esc(subject)}</h1>
<p style="font-size:14px;line-height:1.6;margin:0 0 16px">${esc(intro)}</p>
<p style="margin:0 0 16px;text-align:center"><span style="display:inline-block;padding:14px 22px;border-radius:10px;background:#EEF3FF;color:#071A33;font-size:30px;font-weight:700;letter-spacing:.35em;font-family:'Courier New',monospace">${esc(digits)}</span></p>
${after.map((l) => `<p style="font-size:13px;line-height:1.6;margin:0 0 10px;color:#3B4660">${esc(l)}</p>`).join('')}`;
  return frame(subject, inner, `${subject}\n\n${intro}\n\n${digits}\n\n${after.join('\n\n')}`);
}
export type SecurityNoticeKind = 'password_changed_notification' | 'email_changed_notification' | 'phone_changed_notification' | 'identity_linked_notification' | 'identity_unlinked_notification' | 'mfa_factor_enrolled_notification' | 'mfa_factor_unenrolled_notification';
/** "an•••@example.com": enough for the owner to recognise, not a full address in someone else's inbox. */
const maskAddress = (e: string) => { const [u, dom] = e.split('@'); return dom ? `${u.slice(0, 2)}•••@${dom}` : '•••'; };
export const emailTemplates = {
  /** Sign-up step 2: the six-digit code typed on the "Verify your email" screen. */
  verifySignupCode: (code: string, seconds: number) => codeEmail('Verify your INRGIFT email', 'Your 6-digit INRGIFT verification code is:', code,
    [`This code expires in ${lifetimeText(seconds)} and can only be used once. Requesting a new code replaces this one.`, 'Never share this code. INRGIFT will never ask you for it by phone, chat or email.', 'If you did not create an INRGIFT account, you can ignore this email.']),
  confirmSignup: (link: string) => layout('Confirm your email for INRGIFT', [smsSecondFactor ? 'Confirm this address to continue setting up your account. After confirming, sign in with your email and password and verify your mobile number.' : 'Confirm this address to finish setting up your account. After confirming, sign in with your email and password.', `The link expires in ${lifetimeText(emailOtpSeconds)} and works once.`], { label: 'Confirm email', href: link }),
  resetPassword: (link: string) => layout('Reset your INRGIFT password', [smsSecondFactor ? 'Use this link to choose a new password. You will also confirm a code sent to your phone; resetting your password never turns off SMS verification.' : 'Use this link to choose a new password.', `The link expires in ${lifetimeText(emailOtpSeconds)} and works once.`], { label: 'Choose a new password', href: link }),
  /** To the NEW address: confirms it can receive email before the account switches to it. */
  confirmEmailChange: (link: string) => layout('Confirm your new INRGIFT email address', ['Confirm this address to use it for your INRGIFT account. Until you do, the account keeps its current email address.', `The link expires in ${lifetimeText(emailOtpSeconds)} and works once.`], { label: 'Confirm new email', href: link }, 'If you did not ask to use this address for INRGIFT, ignore this email; nothing changes.'),
  /** To the CURRENT address when secure email change is on: the change happens only after both addresses confirm. */
  confirmEmailChangeFromCurrent: (link: string, newEmail: string) => layout('Confirm the change of your INRGIFT email address', [`Someone asked to change the email address on your INRGIFT account to ${maskAddress(newEmail)}.`, 'If that was you, confirm here. The change happens only after both the current and the new address confirm.', `The link expires in ${lifetimeText(emailOtpSeconds)} and works once.`], { label: 'Confirm email change', href: link }, 'If you did not ask for this, do not click the link, reset your password and contact support@inrgift.com.'),
  reauthenticate: (code: string) => codeEmail('Your INRGIFT confirmation code', 'Enter this code to confirm a sensitive change to your account:', code, ['It expires shortly and works once.', 'Never share this code. INRGIFT will never ask you for it by phone, chat or email.', 'If you did not ask for this, reset your password and contact support.']),
  /** Supabase security notifications (Authentication → Notifications), worded for INRGIFT. */
  securityNotice: (kind: SecurityNoticeKind, d: { oldEmail?: string; provider?: string } = {}) => {
    const method = d.provider === 'google' ? 'Google sign-in' : d.provider === 'apple' ? 'Apple sign-in' : 'A sign-in method';
    const [title, line] = ({
      password_changed_notification: ['Your INRGIFT password changed', 'The password on your INRGIFT account was changed.'],
      email_changed_notification: ['Your INRGIFT email address changed', `The email address on your INRGIFT account was changed${d.oldEmail ? ` from ${maskAddress(d.oldEmail)}` : ''}. This address now receives account emails.`],
      phone_changed_notification: ['Your INRGIFT mobile number changed', 'The mobile number on your INRGIFT account was changed.'],
      identity_linked_notification: ['A sign-in method was added to your INRGIFT account', `${method} was connected to your INRGIFT account.`],
      identity_unlinked_notification: ['A sign-in method was removed from your INRGIFT account', `${method} was disconnected from your INRGIFT account.`],
      mfa_factor_enrolled_notification: ['A verification method was added to your INRGIFT account', 'A new verification method was added to your INRGIFT account.'],
      mfa_factor_unenrolled_notification: ['A verification method was removed from your INRGIFT account', 'A verification method was removed from your INRGIFT account.'],
    } as const)[kind];
    return layout(title, [line, `Time of this notice: ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC.`], undefined, 'If you did not make this change, reset your password now and contact support@inrgift.com immediately.');
  },
  phoneChanged: (masked: string) => layout('Your INRGIFT mobile number changed', [`The mobile number on your account is now ${masked}. Sign-in codes go to this number from now on.`], undefined, 'If you did not make this change, reset your password and contact support immediately.'),
  /** Sent only to the signed-in session's own verified address after it submitted a closure request. */
  closureReceived: (reference: string, giftId: string | null) => layout('We received your INRGIFT account closure request', [
    `Reference: ${reference}`, ...(giftId ? [`GIFT ID: ${giftId}`] : []),
    'Your account closure request has been submitted. The closure process takes 2 working days once the request is submitted.',
  ], undefined, 'If you did not make this request, contact support@inrgift.com immediately.'),
  passwordChanged: () => layout('Your INRGIFT password changed', ['Your password was changed. Other sessions have been signed out.'], undefined, 'If you did not make this change, reset your password and contact support immediately.'),
};
