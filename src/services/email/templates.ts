/**
 * Transactional email content. Plain, branded HTML plus a text part. Links point only at INRGIFT's own
 * /auth/confirm route, which verifies the token with Supabase on the server.
 */
import { smsSecondFactor } from '@/lib/config';

export interface RenderedEmail { subject: string; html: string; text: string }
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
function layout(title: string, lines: string[], action?: { label: string; href: string }, foot = 'If you did not request this, you can ignore this email.'): RenderedEmail {
  const html = `<!doctype html><html><body style="margin:0;background:#F5F7FB;font-family:Arial,Helvetica,sans-serif;color:#0B0E14">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px">
<tr><td><p style="margin:0 0 4px;font-weight:700;font-size:18px;color:#0A1F44">INRGIFT</p><p style="margin:0 0 20px;font-size:11px;letter-spacing:.08em;color:#5F6B84">INVEST BEYOND BORDERS</p>
<h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>
${lines.map((l) => `<p style="font-size:14px;line-height:1.6;margin:0 0 12px">${esc(l)}</p>`).join('')}
${action ? `<p style="margin:20px 0"><a href="${esc(action.href)}" style="background:#245BFE;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block">${esc(action.label)}</a></p><p style="font-size:12px;color:#5F6B84;word-break:break-all">${esc(action.href)}</p>` : ''}
<p style="font-size:12px;color:#5F6B84;margin:20px 0 0">${esc(foot)}</p>
<p style="font-size:11px;color:#5F6B84;margin:12px 0 0">INRGIFT is a research and information platform. It is not a broker or an investment adviser.</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `INRGIFT · INVEST BEYOND BORDERS\n\n${title}\n\n${lines.join('\n\n')}${action ? `\n\n${action.label}: ${action.href}` : ''}\n\n${foot}`;
  return { subject: title, html, text };
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
  const html = `<!doctype html><html><body style="margin:0;background:#F5F7FB;font-family:Arial,Helvetica,sans-serif;color:#0B0E14">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px">
<tr><td><p style="margin:0 0 4px;font-weight:700;font-size:18px;color:#071A33">INRGIFT</p><p style="margin:0 0 20px;font-size:11px;letter-spacing:.08em;color:#5F6B84">INVEST BEYOND BORDERS</p>
<h1 style="font-size:20px;margin:0 0 12px">${esc(subject)}</h1>
<p style="font-size:14px;line-height:1.6;margin:0 0 16px">${esc(intro)}</p>
<p style="margin:0 0 16px;text-align:center"><span style="display:inline-block;padding:14px 22px;border-radius:10px;background:#EEF3FF;color:#071A33;font-size:30px;font-weight:700;letter-spacing:.35em;font-family:'Courier New',monospace">${esc(digits)}</span></p>
${after.map((l) => `<p style="font-size:13px;line-height:1.6;margin:0 0 10px;color:#3B4660">${esc(l)}</p>`).join('')}
<p style="font-size:12px;color:#5F6B84;margin:20px 0 0">Questions? Write to support@inrgift.com.</p>
<p style="font-size:11px;color:#5F6B84;margin:12px 0 0">INRGIFT is a research and information platform. It is not a broker or an investment adviser.</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `INRGIFT · INVEST BEYOND BORDERS\n\n${subject}\n\n${intro}\n\n${digits}\n\n${after.join('\n\n')}\n\nQuestions? Write to support@inrgift.com.`;
  return { subject, html, text };
}
const lifetime = (minutes: number) => (minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} hour${minutes === 60 ? '' : 's'}` : `${minutes} minutes`);
export const emailTemplates = {
  /** Sign-up step 2: the six-digit code typed on the "Verify your email" screen. */
  verifySignupCode: (code: string, minutes: number) => codeEmail('Verify your INRGIFT email', 'Enter this 6-digit code on the INRGIFT "Verify your email" screen to confirm this address:', code,
    [`The code expires ${lifetime(minutes)} after it was sent and works once. Requesting a new code replaces this one.`, 'Never share this code. INRGIFT will never ask you for it by phone, chat or email.', 'If you did not create an INRGIFT account, you can ignore this email.']),
  confirmSignup: (link: string) => layout('Confirm your email for INRGIFT', [smsSecondFactor ? 'Confirm this address to continue setting up your account. After confirming, sign in with your email and password and verify your mobile number.' : 'Confirm this address to finish setting up your account. After confirming, sign in with your email and password.', 'The link expires in one hour and works once.'], { label: 'Confirm email', href: link }),
  resetPassword: (link: string) => layout('Reset your INRGIFT password', [smsSecondFactor ? 'Use this link to choose a new password. You will also confirm a code sent to your phone; resetting your password never turns off SMS verification.' : 'Use this link to choose a new password.', 'The link expires in one hour and works once.'], { label: 'Choose a new password', href: link }),
  confirmEmailChange: (link: string) => layout('Confirm your new email address', ['Confirm this address to use it for your INRGIFT account.'], { label: 'Confirm new email', href: link }),
  reauthenticate: (code: string) => layout('Your INRGIFT confirmation code', [`Enter this code to confirm a sensitive change: ${code}`, 'It expires shortly and works once.']),
  phoneChanged: (masked: string) => layout('Your INRGIFT mobile number changed', [`The mobile number on your account is now ${masked}. Sign-in codes go to this number from now on.`], undefined, 'If you did not make this change, reset your password and contact support immediately.'),
  /** Sent only to the signed-in session's own verified address after it submitted a closure request. */
  closureReceived: (reference: string, giftId: string | null) => layout('We received your INRGIFT account closure request', [
    `Reference: ${reference}`, ...(giftId ? [`GIFT ID: ${giftId}`] : []),
    'Your account closure request has been submitted. The closure process takes 2 working days once the request is submitted.',
  ], undefined, 'If you did not make this request, contact support@inrgift.com immediately.'),
  passwordChanged: () => layout('Your INRGIFT password changed', ['Your password was changed. Other sessions have been signed out.'], undefined, 'If you did not make this change, reset your password and contact support immediately.'),
};
