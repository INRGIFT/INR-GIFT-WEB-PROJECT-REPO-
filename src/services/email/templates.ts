/**
 * Transactional email content. Plain, branded HTML plus a text part. Links point only at INRGIFT's own
 * /auth/confirm route, which verifies the token with Supabase on the server.
 */
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
export const emailTemplates = {
  confirmSignup: (link: string) => layout('Confirm your email for INRGIFT', ['Confirm this address to continue setting up your account. After confirming, sign in with your email and password and verify your mobile number.', 'The link expires in one hour and works once.'], { label: 'Confirm email', href: link }),
  resetPassword: (link: string) => layout('Reset your INRGIFT password', ['Use this link to choose a new password. You will also confirm a code sent to your phone; resetting your password never turns off SMS verification.', 'The link expires in one hour and works once.'], { label: 'Choose a new password', href: link }),
  confirmEmailChange: (link: string) => layout('Confirm your new email address', ['Confirm this address to use it for your INRGIFT account.'], { label: 'Confirm new email', href: link }),
  reauthenticate: (code: string) => layout('Your INRGIFT confirmation code', [`Enter this code to confirm a sensitive change: ${code}`, 'It expires shortly and works once.']),
  phoneChanged: (masked: string) => layout('Your INRGIFT mobile number changed', [`The mobile number on your account is now ${masked}. Sign-in codes go to this number from now on.`], undefined, 'If you did not make this change, reset your password and contact support immediately.'),
  passwordChanged: () => layout('Your INRGIFT password changed', ['Your password was changed. Other sessions have been signed out.'], undefined, 'If you did not make this change, reset your password and contact support immediately.'),
};
