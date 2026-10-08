import { json, ProviderError, request, statusCode, type Fetch } from './http';

/**
 * Resend adapter (server only). POST https://api.resend.com/emails with `Authorization: Bearer <RESEND_API_KEY>` and
 * { from, to, subject, html, text }; success returns { id } (resend.com/docs/api-reference/emails/send-email).
 */
export interface EmailMessage { to: string; subject: string; html: string; text: string; replyTo?: string; tags?: { name: string; value: string }[];
  /** Resend's Idempotency-Key header: the same key within 24 hours never sends a second email (notification event id). */
  idempotencyKey?: string }
export interface EmailProvider { send(m: EmailMessage): Promise<{ id: string }> }
const NAME = 'resend';

export function resend(opts: { apiKey: string; from: string; fetchImpl?: Fetch; timeoutMs?: number }): EmailProvider {
  if (!opts.apiKey || !opts.from) throw new ProviderError(NAME, 'NOT_CONFIGURED');
  return {
    async send(m) {
      const res = await request(NAME, 'https://api.resend.com/emails', {
        method: 'POST', fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs,
        headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json', ...(m.idempotencyKey ? { 'Idempotency-Key': m.idempotencyKey.slice(0, 256) } : {}) },
        body: JSON.stringify({ from: opts.from, to: [m.to], subject: m.subject, html: m.html, text: m.text, ...(m.replyTo ? { reply_to: m.replyTo } : {}), ...(m.tags ? { tags: m.tags } : {}) }),
      });
      const code = statusCode(res.status);
      if (code) throw new ProviderError(NAME, code, res.status);
      const body = (await json(NAME, res)) as { id?: unknown };
      if (typeof body?.id !== 'string') throw new ProviderError(NAME, 'MALFORMED', res.status);
      return { id: body.id };
    },
  };
}
