import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyStandardWebhook } from '@/lib/standard-webhooks';
import { ProviderError } from '@/services/providers/http';
import { resend } from '@/services/providers/resend';
import { twoFactor } from '@/services/providers/twofactor';

const KEY = 'tf-secret-key-1234';
const res = (status: number, body: unknown) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const fetchReturning = (...r: Response[]) => { const calls: { url: string; init?: RequestInit }[] = []; const f = (async (url: string, init?: RequestInit) => { calls.push({ url, init }); return r.shift() ?? res(500, {}); }) as unknown as typeof fetch; return { f, calls }; };
const errText = async (p: Promise<unknown>) => { try { await p; return 'no error'; } catch (e) { return `${(e as Error).message} ${JSON.stringify(e)}`; } };
afterEach(() => vi.restoreAllMocks());

describe('2Factor.in adapter', () => {
  it('sends with AUTOGEN (no OTP in the response) and returns the 2Factor session id', async () => {
    const { f, calls } = fetchReturning(res(200, { Status: 'Success', Details: 'sess-123' }));
    const r = await twoFactor({ apiKey: KEY, template: 'INRGIFT OTP', fetchImpl: f }).sendOtp('+919876543210');
    expect(r).toEqual({ sessionId: 'sess-123' });
    expect(calls[0].url).toBe(`https://2factor.in/API/V1/${KEY}/SMS/%2B919876543210/AUTOGEN/INRGIFT%20OTP`);
    expect(calls[0].init?.method).toBe('GET');
  });
  it('verifies with VERIFY/{session}/{otp}: matched, mismatch, expired', async () => {
    const { f, calls } = fetchReturning(res(200, { Status: 'Success', Details: 'OTP Matched' }), res(200, { Status: 'Error', Details: 'OTP Mismatch' }), res(200, { Status: 'Error', Details: 'OTP Expired' }));
    const p = twoFactor({ apiKey: KEY, fetchImpl: f });
    expect(await p.verifyOtp('sess-123', '123456')).toBe('matched');
    expect(await p.verifyOtp('sess-123', '000000')).toBe('mismatch');
    expect(await p.verifyOtp('sess-123', '123456')).toBe('expired');
    expect(calls[0].url).toBe(`https://2factor.in/API/V1/${KEY}/SMS/VERIFY/sess-123/123456`);
  });
  it('never sends malformed codes to the provider', async () => {
    const { f, calls } = fetchReturning();
    expect(await twoFactor({ apiKey: KEY, fetchImpl: f }).verifyOtp('sess', '12ab')).toBe('mismatch');
    expect(calls).toHaveLength(0);
  });
  it('maps provider errors and never leaks the API key', async () => {
    const cases: [Response, string][] = [[res(200, { Status: 'Error', Details: 'Invalid API Key' }), 'INVALID_KEY'], [res(200, { Status: 'Error', Details: 'Insufficient balance' }), 'QUOTA'], [res(503, 'down'), 'MALFORMED'], [res(500, { Status: 'Error', Details: 'Server error' }), 'UNAVAILABLE']];
    for (const [r, code] of cases) {
      const { f } = fetchReturning(r);
      const text = await errText(twoFactor({ apiKey: KEY, fetchImpl: f }).sendOtp('+919876543210'));
      expect(text).toContain(code);
      expect(text).not.toContain(KEY);
      expect(text).not.toContain('2factor.in/API');
    }
  });
  it('timeouts and network failures become safe errors', async () => {
    const hang = (async (_u: string, init?: RequestInit) => new Promise((_, rej) => init?.signal?.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))))) as unknown as typeof fetch;
    await expect(twoFactor({ apiKey: KEY, fetchImpl: hang, timeoutMs: 20 }).sendOtp('+919876543210')).rejects.toMatchObject({ code: 'TIMEOUT' });
    const down = (async () => { throw new TypeError(`fetch failed for https://2factor.in/API/V1/${KEY}`); }) as unknown as typeof fetch;
    const text = await errText(twoFactor({ apiKey: KEY, fetchImpl: down }).sendOtp('+919876543210'));
    expect(text).toContain('NETWORK'); expect(text).not.toContain(KEY);
  });
  it('refuses to start without a key', () => expect(() => twoFactor({ apiKey: '' })).toThrow(ProviderError));
});

describe('Resend adapter', () => {
  const RK = 're_test_secret';
  it('sends with Bearer auth to /emails and returns the id', async () => {
    const { f, calls } = fetchReturning(res(200, { id: 'em_1' }));
    const r = await resend({ apiKey: RK, from: 'INRGIFT <no-reply@example.com>', fetchImpl: f }).send({ to: 'a@example.com', subject: 'S', html: '<p>h</p>', text: 't' });
    expect(r).toEqual({ id: 'em_1' });
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${RK}`);
    expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({ from: 'INRGIFT <no-reply@example.com>', to: ['a@example.com'], subject: 'S' });
  });
  it('maps errors without leaking the key', async () => {
    for (const [status, code] of [[401, 'INVALID_KEY'], [422, 'REJECTED'], [429, 'RATE_LIMITED'], [500, 'UNAVAILABLE']] as const) {
      const { f } = fetchReturning(res(status, { message: `bad ${RK}` }));
      const text = await errText(resend({ apiKey: RK, from: 'x@example.com', fetchImpl: f }).send({ to: 'a@example.com', subject: 'S', html: 'h', text: 't' }));
      expect(text).toContain(code); expect(text).not.toContain(RK);
    }
  });
});

describe('Standard Webhooks signature (Supabase Send Email Hook)', () => {
  const secretB64 = Buffer.from('super-secret-hook-key').toString('base64');
  const secret = `v1,whsec_${secretB64}`;
  const sign = (id: string, ts: string, body: string) => `v1,${createHmac('sha256', Buffer.from(secretB64, 'base64')).update(`${id}.${ts}.${body}`).digest('base64')}`;
  const now = Date.parse('2026-10-07T10:00:00Z');
  const ts = String(Math.floor(now / 1000));
  const body = '{"user":{"email":"a@example.com"}}';
  const h = (sig: string, t = ts) => new Headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': t, 'webhook-signature': sig });
  it('accepts a valid signature', () => expect(verifyStandardWebhook(secret, h(sign('msg_1', ts, body)), body, now)).toBe(true));
  it('rejects a tampered body, a wrong secret and an old timestamp', () => {
    expect(verifyStandardWebhook(secret, h(sign('msg_1', ts, body)), body.replace('a@', 'b@'), now)).toBe(false);
    expect(verifyStandardWebhook('v1,whsec_' + Buffer.from('other').toString('base64'), h(sign('msg_1', ts, body)), body, now)).toBe(false);
    const old = String(Math.floor(now / 1000) - 3600);
    expect(verifyStandardWebhook(secret, h(sign('msg_1', old, body), old), body, now)).toBe(false);
    expect(verifyStandardWebhook(secret, new Headers(), body, now)).toBe(false);
  });
});

describe('Send Email Hook route', () => {
  const secretB64 = Buffer.from('hook-route-secret').toString('base64');
  const call = async (payload: unknown, sign = true) => {
    vi.stubEnv('SEND_EMAIL_HOOK_SECRET', `v1,whsec_${secretB64}`);
    vi.stubEnv('RESEND_API_KEY', 're_route_test'); vi.stubEnv('RESEND_FROM_EMAIL', 'INRGIFT <no-reply@example.com>');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const { setEmailProvider } = await import('@/services/email/email-service');
    const sent: { to: string; subject: string; html: string; text: string }[] = [];
    setEmailProvider({ async send(m) { sent.push(m); return { id: 'em' }; } });
    const { POST } = await import('@/app/api/hooks/send-email/route');
    const body = JSON.stringify(payload), ts = String(Math.floor(Date.now() / 1000));
    const sig = `v1,${createHmac('sha256', Buffer.from(secretB64, 'base64')).update(`m1.${ts}.${body}`).digest('base64')}`;
    const req = new Request('http://localhost/api/hooks/send-email', { method: 'POST', body, headers: sign ? { 'webhook-id': 'm1', 'webhook-timestamp': ts, 'webhook-signature': sig } : {} });
    const r = await POST(req as never);
    return { status: r.status, sent };
  };
  afterEach(() => vi.unstubAllEnvs());
  it('sends the sign-up confirmation through Resend with a link to /auth/confirm', async () => {
    // The payload's site_url is ignored: links always use INRGIFT's configured site URL (https://inrgift.com in production).
    const { status, sent } = await call({ user: { email: 'a@example.com' }, email_data: { email_action_type: 'signup', token_hash: 'th_1', token: '123456', site_url: 'https://attacker.example' } });
    const { config } = await import('@/lib/config');
    const site = config.siteUrl.replace(/\/$/, '');
    expect(status).toBe(200);
    expect(sent[0].to).toBe('a@example.com');
    expect(sent[0].html).toContain(`${site}/auth/confirm?token_hash=th_1&amp;type=signup`);
    expect(sent[0].text).toContain(`${site}/auth/confirm?token_hash=th_1&type=signup`);
    expect(sent[0].text).not.toContain('attacker.example');
  });
  it('rejects unsigned calls and refuses passwordless email types', async () => {
    expect((await call({ user: { email: 'a@example.com' }, email_data: { email_action_type: 'signup', token_hash: 'x' } }, false)).status).toBe(401);
    const r = await call({ user: { email: 'a@example.com' }, email_data: { email_action_type: 'magiclink', token_hash: 'x' } });
    expect(r.status).toBe(422); expect(r.sent).toHaveLength(0);
  });
});
