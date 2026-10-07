import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a Standard Webhooks signature (standardwebhooks.com), the scheme Supabase Auth hooks use:
 * headers webhook-id, webhook-timestamp, webhook-signature ("v1,<base64>" entries, space separated);
 * signed content `${id}.${timestamp}.${body}`, HMAC-SHA256 keyed with the base64 secret after "v1,whsec_".
 */
export function verifyStandardWebhook(secret: string, headers: Headers, body: string, now = Date.now(), toleranceSec = 300): boolean {
  const id = headers.get('webhook-id'), ts = headers.get('webhook-timestamp'), sig = headers.get('webhook-signature');
  if (!secret || !id || !ts || !sig || !/^\d+$/.test(ts)) return false;
  if (Math.abs(now / 1000 - Number(ts)) > toleranceSec) return false;
  const key = Buffer.from(secret.replace(/^v1,/, '').replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest();
  return sig.split(' ').some((part) => {
    const [ver, b64] = part.split(',');
    if (ver !== 'v1' || !b64) return false;
    const got = Buffer.from(b64, 'base64');
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
