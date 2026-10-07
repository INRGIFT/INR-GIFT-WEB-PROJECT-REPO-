import { configured, serverEnv } from '@/lib/server-env';
import { log } from '@/lib/telemetry/log';
import { resend, type EmailProvider } from '@/services/providers/resend';
import { ProviderError } from '@/services/providers/http';
import type { RenderedEmail } from './templates';

/**
 * Transactional email through Resend. Sending an email never marks anything verified: Supabase Auth remains the
 * source of truth for email confirmation. Failures are logged by code only (never the address body or a link).
 */
let provider: EmailProvider | null = null;
export const setEmailProvider = (p: EmailProvider | null) => { provider = p; };
function getProvider(): EmailProvider {
  if (provider) return provider;
  if (!configured.email()) throw new ProviderError('resend', 'NOT_CONFIGURED');
  return (provider = resend({ apiKey: serverEnv.resendApiKey(), from: serverEnv.resendFrom() }));
}
export async function sendEmail(to: string, mail: RenderedEmail, kind: string, opts: { replyTo?: string } = {}): Promise<{ ok: true; id: string } | { ok: false; code: string }> {
  try {
    const { id } = await getProvider().send({ to, ...mail, ...(opts.replyTo ? { replyTo: opts.replyTo } : {}), tags: [{ name: 'kind', value: kind }] });
    return { ok: true, id };
  } catch (e) {
    const code = e instanceof ProviderError ? e.code : 'UNKNOWN';
    log('warn', 'email_failed', { kind, code });
    return { ok: false, code };
  }
}
