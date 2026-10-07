import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerSession } from '@/features/auth/server-facts';

/**
 * GIFT ID in the application layer (the database rules are tested in supabase/tests/gift-id*.sql). Supabase is
 * replaced by a fake client and a fake session reader: what matters here is that the GIFT ID always comes from the
 * signed-in session's own profile row, never from anything a browser sends, and is never treated as a credential.
 */
const state = vi.hoisted(() => ({ session: null as ServerSession | null, rows: new Map<string, Record<string, unknown>>(), queried: [] as string[], missingColumn: false }));
vi.mock('@/lib/config', async (orig) => ({ ...(await orig<typeof import('@/lib/config')>()), authMode: 'supabase', isSupabaseConfigured: true }));
vi.mock('@/features/auth/server-facts', () => ({ readServerSession: vi.fn(async () => state.session) }));
vi.mock('@/supabase/server', () => ({
  supabaseServer: async () => ({
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (col: string, value: string) => ({
          maybeSingle: async () => {
            expect(table).toBe('profiles'); expect(col).toBe('user_id');
            state.queried.push(value);
            if (state.missingColumn && cols.includes('gift_id')) return { data: null, error: { code: '42703', message: 'column does not exist' } };
            const row = state.rows.get(value);
            return { data: row ? Object.fromEntries(Object.entries(row).filter(([k]) => cols.split(',').map((c) => c.trim()).includes(k))) : null, error: null };
          },
        }),
      }),
    }),
  }),
}));

const A = { userId: '11111111-1111-4111-8111-111111111111', email: 'asha@example.com', gift: 'GIFT-7K4M92PX' };
const B = { userId: '22222222-2222-4222-8222-222222222222', email: 'ravi@example.com', gift: 'GIFT-3QZ8W1HN' };
function session(who: typeof A, over: Partial<ServerSession> = {}): ServerSession {
  return {
    userId: who.userId, sessionId: 's-1', email: who.email, amr: ['password'], emailConfirmed: true, phoneConfirmed: false, phone: null, signupPhone: '+919876543210',
    profile: { providers: ['email'], phone: '+919876543210', country: 'India', passwordSet: true, termsAcceptedAt: '2026-10-01T00:00:00Z' },
    facts: { signedIn: true, emailConfirmed: true, phoneVerified: false, primarySignIn: true, profileComplete: true, smsVerified: false },
    gate: 'ok', account: { name: 'Asha Rao', country: 'India', createdAt: '2026-10-01T09:00:00Z', lastSignInAt: '2026-10-07T08:00:00Z' },
    session: { method: 'password', startedAt: '2026-10-07T08:00:00Z', tokenExpiresAt: '2026-10-07T09:00:00Z' },
    ...over,
  } as ServerSession;
}
beforeEach(() => {
  state.session = null; state.queried = []; state.missingColumn = false;
  state.rows = new Map([[A.userId, { gift_id: A.gift, full_name: 'Asha Rao', country: 'India', created_at: '2026-10-01T09:00:00Z' }], [B.userId, { gift_id: B.gift, full_name: 'Ravi Iyer', country: 'India', created_at: '2026-10-02T09:00:00Z' }]]);
});

describe('GIFT ID format', () => {
  it('is GIFT- plus 8 Crockford base32 characters, case-normalised, and nothing else', async () => {
    const { GIFT_ID_PATTERN, normalizeGiftId } = await import('@/features/account/types');
    for (const ok of ['GIFT-7K4M92PX', 'GIFT-00000000', 'GIFT-ZZZZZZZZ']) expect(GIFT_ID_PATTERN.test(ok)).toBe(true);
    for (const bad of ['GIFT-7K4M92P', 'GIFT-7K4M92PXX', 'GIFT-7K4M92PI', 'GIFT-7K4M92PL', 'GIFT-7K4M92PO', 'GIFT-7K4M92PU', 'gift-7k4m92px', 'GIFT 7K4M92PX', 'INR-7K4M92PX']) expect(GIFT_ID_PATTERN.test(bad)).toBe(false);
    expect(normalizeGiftId('  gift-7k4m92px ')).toBe('GIFT-7K4M92PX');
  });
});

describe('GET /api/v1/me', () => {
  const get = async () => { const { GET } = await import('@/app/api/v1/me/route'); const r = await GET(); return { status: r.status, body: await r.json(), cache: r.headers.get('cache-control') }; };
  it('signed out: 401, no account data', async () => {
    const r = await get();
    expect(r.status).toBe(401);
    expect(JSON.stringify(r.body)).not.toMatch(/GIFT-/);
  });
  it('not fully verified: 403 with the next step, no account data', async () => {
    state.session = session(A, { gate: 'verify-email' } as Partial<ServerSession>);
    const r = await get();
    expect(r.status).toBe(403);
    expect(r.body.error.step).toBe('verify-email');
    expect(JSON.stringify(r.body)).not.toContain(A.gift);
  });
  it('returns the session owner\'s own GIFT ID and details (User A sees A, User B sees B), never cached', async () => {
    state.session = session(A);
    const a = await get();
    expect(a.status).toBe(200);
    expect(a.cache).toBe('private, no-store');
    expect(a.body.data).toMatchObject({ giftId: A.gift, name: 'Asha Rao', email: A.email, country: 'India', emailVerified: true, phoneVerified: false, passwordSet: true, createdAt: '2026-10-01T09:00:00Z' });
    expect(a.body.data.session).toEqual({ method: 'password', startedAt: '2026-10-07T08:00:00Z', tokenExpiresAt: '2026-10-07T09:00:00Z' });
    expect(state.queried).toEqual([A.userId]);
    state.session = session(B);
    const b = await get();
    expect(b.body.data.giftId).toBe(B.gift);
    expect(JSON.stringify(b.body)).not.toContain(A.gift);
    // Never a password, token or code in the payload.
    expect(JSON.stringify(a.body)).not.toMatch(/access_token|refresh_token|password"\s*:|"pw"|otp/i);
  });
  it('before migration 0008 (no gift_id column) the account still loads, with giftId null', async () => {
    state.missingColumn = true; state.session = session(A);
    const r = await get();
    expect(r.status).toBe(200);
    expect(r.body.data.giftId).toBeNull();
    expect(r.body.data.name).toBe('Asha Rao');
  });
});

describe('support, grievance and account closure carry the session\'s GIFT ID only', () => {
  const sent: { to: string; subject: string; html: string; text: string; replyTo?: string }[] = [];
  let ip = 0;
  beforeEach(async () => {
    sent.length = 0;
    vi.stubEnv('RESEND_API_KEY', 're_test_key_never_shown'); vi.stubEnv('RESEND_FROM_EMAIL', 'INRGIFT <no-reply@inrgift.com>');
    const { setEmailProvider } = await import('@/services/email/email-service');
    setEmailProvider({ async send(m) { sent.push(m); return { id: 'em_1' }; } });
  });
  afterEach(async () => { vi.unstubAllEnvs(); (await import('@/services/email/email-service')).setEmailProvider(null); });
  const post = async (kind: string, body: Record<string, unknown>) => {
    const { POST } = await import('@/app/api/forms/[kind]/route');
    const req = new NextRequest(`http://localhost/api/forms/${kind}`, { method: 'POST', body: JSON.stringify({ ...body, elapsedMs: 5000 }), headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.18.0.${(ip += 1)}`, origin: 'http://localhost' } });
    const r = await POST(req, { params: Promise.resolve({ kind }) });
    return { status: r.status, body: await r.json() };
  };
  const support = { name: 'Asha Rao', email: A.email, phone: '', category: 'login', subject: 'Cannot sign in', message: 'I cannot sign in since yesterday evening.', consent: true };
  const grievance = { name: 'Asha Rao', email: A.email, phone: '+91 98765 43210', category: 'service', subject: 'Service was down', description: 'The service was not reachable for most of the day on Monday.', reference: '', consent: true };
  const closure = { email: A.email, name: 'Asha Rao', reference: '', phone: '', reason: '', confirmRegisteredEmail: true, acknowledgeChecklist: true, acknowledgeResidual: true, finalAcknowledge: true };

  it('signed in: the support email names the verified GIFT ID from the session; the response does not', async () => {
    state.session = session(A);
    const r = await post('support', support);
    expect(r.status).toBe(201);
    expect(sent[0].text).toContain(`GIFT ID (verified, from the signed-in session)`);
    expect(sent[0].text).toContain(A.gift);
    expect(JSON.stringify(r.body)).not.toContain(A.gift);
  });
  it('a GIFT ID typed into the form is kept as unverified text and never identifies anyone', async () => {
    state.session = session(A);
    await post('grievance', { ...grievance, giftId: B.gift.toLowerCase() });
    expect(sent[0].text).toContain(`GIFT ID (as entered by the sender, not verified)`);
    expect(sent[0].text).toContain(B.gift);
    expect(sent[0].text).toMatch(new RegExp(`verified, from the signed-in session\\)[^\\n]*${A.gift}|${A.gift}`));
    // B's account was never looked up: only the session's own user id was queried.
    expect(state.queried).toEqual([A.userId]);
  });
  it('public (signed out): the form works, a typed GIFT ID stays unverified, and nothing reveals whether it exists', async () => {
    const withId = await post('support', { ...support, email: 'visitor@example.com', giftId: A.gift });
    const withoutId = await post('support', { ...support, email: 'visitor2@example.com', giftId: 'GIFT-ZZZZZZZZ' });
    expect(withId.status).toBe(201); expect(withoutId.status).toBe(201);
    expect(Object.keys(withId.body.data)).toEqual(Object.keys(withoutId.body.data));
    expect(sent[0].text).not.toContain('verified, from the signed-in session');
    expect(state.queried).toEqual([]);
  });
  it('an invalid GIFT ID format is a field error, not a lookup', async () => {
    const r = await post('support', { ...support, email: 'v3@example.com', giftId: 'GIFT-ILOU1234' });
    expect(r.status).toBe(400);
    expect(r.body.error.fields.giftId).toBeTruthy();
  });
  it('account closure from the signed-in owner: support gets the GIFT ID and account id; the acknowledgement goes to the session email with the GIFT ID', async () => {
    state.session = session(A);
    const r = await post('account-closure', closure);
    expect(r.status).toBe(201);
    expect(sent).toHaveLength(2);
    expect(sent[0].to).toBe('support@inrgift.com');
    expect(sent[0].text).toContain(A.gift);
    expect(sent[0].text).toContain(A.userId);
    expect(sent[1].to).toBe(A.email);
    expect(sent[1].text).toContain(A.gift);
    expect(sent[1].text).toContain(r.body.data.reference);
  });
  it('account closure for a different email than the session: no account id and no acknowledgement to anyone', async () => {
    state.session = session(A);
    await post('account-closure', { ...closure, email: 'someone.else@example.com' });
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain('No: signed in with a different email');
    expect(sent[0].text).not.toContain(A.userId);
  });
});

describe('email templates', () => {
  it('the sign-up code email carries the code, its lifetime and the support address, and no link', async () => {
    const { emailTemplates } = await import('@/services/email/templates');
    const m = emailTemplates.verifySignupCode('482913', 60);
    expect(m.subject).toBe('Verify your INRGIFT email');
    expect(m.text).toContain('482913');
    expect(m.text).toMatch(/60 minutes|1 hour/);
    expect(m.text).toContain('support@inrgift.com');
    expect(m.html).not.toMatch(/href="https?:\/\/[^"]*(token|confirm)/);
  });
  it('the closure acknowledgement includes the GIFT ID only when there is one', async () => {
    const { emailTemplates } = await import('@/services/email/templates');
    expect(emailTemplates.closureReceived('INR-CLS-20261007-ABCDEF12', A.gift).text).toContain(A.gift);
    expect(emailTemplates.closureReceived('INR-CLS-20261007-ABCDEF12', null).text).not.toContain('GIFT-');
  });
});
