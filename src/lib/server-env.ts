/**
 * Server-only secrets. Never import this from a client component: none of these values may reach a browser bundle,
 * a log line, a response body or the deployment zip. All are set as environment variables on the host (docs/DEPLOY.md).
 * None uses the NEXT_PUBLIC_ prefix, so Next.js never inlines them into client code.
 */
if (typeof window !== 'undefined') throw new Error('server-env must not be imported in the browser');

const v = (name: string) => (process.env[name] ?? '').trim();
export const serverEnv = {
  /** Supabase secret key (sb_secret_…) or legacy service-role key: records verified phones and SMS step-ups. */
  supabaseSecretKey: () => v('SUPABASE_SECRET_KEY') || v('SUPABASE_SERVICE_ROLE_KEY'),
  /** Supabase Auth → Hooks → Send Email: the "v1,whsec_…" secret shown there. */
  sendEmailHookSecret: () => v('SEND_EMAIL_HOOK_SECRET'),
  resendApiKey: () => v('RESEND_API_KEY'),
  /** e.g. "INRGIFT <no-reply@yourdomain>", on a domain verified in Resend. */
  resendFrom: () => v('RESEND_FROM_EMAIL'),
  twoFactorApiKey: () => v('TWO_FACTOR_API_KEY'),
  /** Optional 2Factor OTP template name (the last AUTOGEN path segment), as approved on the 2Factor account. */
  twoFactorTemplate: () => v('TWO_FACTOR_OTP_TEMPLATE'),
  /** NewsData.io API key (the "News IO" provider), sent in the X-ACCESS-KEY header. */
  newsApiKey: () => v('NEWSIO_API_KEY'),
};
export const configured = {
  supabaseAdmin: () => Boolean(serverEnv.supabaseSecretKey()),
  email: () => Boolean(serverEnv.resendApiKey() && serverEnv.resendFrom()),
  emailHook: () => Boolean(serverEnv.sendEmailHookSecret()),
  sms: () => Boolean(serverEnv.twoFactorApiKey()),
  news: () => Boolean(serverEnv.newsApiKey()),
};
