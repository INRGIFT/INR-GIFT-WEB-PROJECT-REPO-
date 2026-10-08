import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORMS, validateForm } from '@/features/forms/definitions';
import { isPrimarySignIn, profileFactsOf, profileMissing, workspaceGate, type AuthFacts } from '@/features/auth/policy';
import { setEmailProvider } from '@/services/email/email-service';

const closure = { email: 'asha@example.com', name: 'Asha Rao', reference: '', phone: '', reason: '', confirmRegisteredEmail: true, acknowledgeChecklist: true, acknowledgeResidual: true, finalAcknowledge: true };
const support = { name: 'Asha Rao', email: 'asha@example.com', phone: '', category: 'login', subject: 'Cannot sign in', message: 'I cannot sign in since yesterday evening.', consent: true };
const grievance = { name: 'Asha Rao', email: 'asha@example.com', phone: '+91 98765 43210', category: 'service', subject: 'Service was down', description: 'The service was not reachable for most of the day on Monday.', reference: '', consent: true };

describe('form definitions', () => {
  it('account closure requires the registered email, the name and every acknowledgement', () => {
    expect(validateForm('account-closure', closure).errors).toEqual({});
    const e = validateForm('account-closure', { ...closure, email: '', confirmRegisteredEmail: false, acknowledgeChecklist: false, acknowledgeResidual: false, finalAcknowledge: false }).errors;
    expect(Object.keys(e).sort()).toEqual(['acknowledgeChecklist', 'acknowledgeResidual', 'confirmRegisteredEmail', 'email', 'finalAcknowledge']);
    expect(e.confirmRegisteredEmail).toMatch(/registered email/);
    expect(FORMS['account-closure'].fields.find((f) => f.name === 'confirmRegisteredEmail')?.label).toBe('I confirm that I am submitting this request from my registered email address.');
    // a string "true" is not a ticked box
    expect(validateForm('account-closure', { ...closure, acknowledgeResidual: 'true' }).errors.acknowledgeResidual).toBeTruthy();
  });
  it('cleans input: no line breaks in single-line fields, no control characters, length and option checks', () => {
    const { values, errors } = validateForm('support', { ...support, subject: 'Hi\r\nBcc: victim@example.com', message: 'Line one\u0000\nline two is long enough.' });
    expect(values.subject).toBe('Hi Bcc: victim@example.com');
    expect(values.message).toBe('Line one\nline two is long enough.');
    expect(errors).toEqual({});
    expect(validateForm('support', { ...support, category: 'trading' }).errors.category).toBeTruthy();
    expect(validateForm('support', { ...support, message: 'x'.repeat(4001) }).errors.message).toBeTruthy();
    expect(validateForm('grievance', { ...grievance, phone: '' }).errors.phone).toBeTruthy();
    expect(validateForm('grievance', { ...grievance, reference: '<script>' }).errors.reference).toBeTruthy();
  });
});

describe('/api/forms/[kind]', () => {
  const sent: { to: string; subject: string; html: string; text: string; replyTo?: string }[] = [];
  beforeEach(() => {
    sent.length = 0;
    vi.stubEnv('RESEND_API_KEY', 're_test_key_never_shown'); vi.stubEnv('RESEND_FROM_EMAIL', 'INRGIFT <no-reply@inrgift.com>');
    setEmailProvider({ async send(m) { sent.push(m); return { id: 'em_1' }; } });
  });
  afterEach(() => { vi.unstubAllEnvs(); setEmailProvider(null); });
  let n = 0;
  const post = async (kind: string, body: unknown, headers: Record<string, string> = {}) => {
    const { POST } = await import('@/app/api/forms/[kind]/route');
    const req = new NextRequest(`http://localhost/api/forms/${kind}`, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'content-type': 'application/json', 'x-forwarded-for': `203.0.113.${(n += 1) % 250}`, origin: 'http://localhost', ...headers } });
    const r = await POST(req, { params: Promise.resolve({ kind }) });
    return { status: r.status, body: await r.json() };
  };
  it('emails an account-closure request to support@inrgift.com and answers "submitted", never "closed"', async () => {
    const r = await post('account-closure', { ...closure, email: 'close.me@example.com', elapsedMs: 5000 });
    expect(r.status).toBe(201);
    expect(r.body.data.reference).toMatch(/^INR-CLS-\d{8}-[0-9A-F]{8}$/);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('support@inrgift.com');
    expect(sent[0].subject).toBe('INRGIFT Account Closure Request');
    expect(sent[0].replyTo).toBe('close.me@example.com');
    expect(sent[0].text).toContain('I confirm that I am submitting this request from my registered email address.');
    expect(JSON.stringify(r.body)).not.toMatch(/closed|deleted/i);
    // a repeat within a day returns the same reference and sends nothing new
    const again = await post('account-closure', { ...closure, email: 'close.me@example.com', elapsedMs: 5000 });
    expect(again.status).toBe(200);
    expect(again.body.data).toEqual({ reference: r.body.data.reference, duplicate: true });
    expect(sent).toHaveLength(1);
  });
  it('escapes HTML and keeps provider keys out of every response', async () => {
    const r = await post('grievance', { ...grievance, subject: '<img src=x onerror=alert(1)>', elapsedMs: 5000 });
    expect(r.status).toBe(201);
    expect(sent[0].html).not.toContain('<img src=x');
    expect(sent[0].html).toContain('&lt;img src=x');
    expect(sent[0].subject).toMatch(/^INRGIFT Grievance INR-GRV-/);
    expect(JSON.stringify(r.body)).not.toContain('re_test_key_never_shown');
  });
  it('rejects bad requests safely', async () => {
    expect((await post('trading', support)).status).toBe(404);
    expect((await post('support', { ...support, elapsedMs: 5000 }, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post('support', { ...support, elapsedMs: 5000 }, { 'content-type': 'text/plain' })).status).toBe(415);
    expect((await post('support', JSON.stringify({ ...support, message: 'x'.repeat(20_000), elapsedMs: 5000 }))).status).toBe(413);
    const bad = await post('support', { ...support, email: 'nope', elapsedMs: 5000 });
    expect(bad.status).toBe(400);
    expect(bad.body.error.fields.email).toBeTruthy();
    expect(sent).toHaveLength(0);
  });
  it('drops honeypot and too-fast submissions without sending', async () => {
    expect((await post('support', { ...support, website: 'http://spam', elapsedMs: 5000 })).status).toBe(202);
    expect((await post('support', { ...support, elapsedMs: 50 })).status).toBe(202);
    expect(sent).toHaveLength(0);
  });
  it('reports NOT_CONFIGURED (not success) when Resend is not configured', async () => {
    setEmailProvider(null); vi.stubEnv('RESEND_API_KEY', '');
    const r = await post('support', { ...support, email: 'other@example.com', elapsedMs: 5000 });
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe('NOT_CONFIGURED');
    expect(r.body.data).toBeUndefined();
  });
  it('rate-limits one connection', async () => {
    const { POST } = await import('@/app/api/forms/[kind]/route');
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const req = new NextRequest('http://localhost/api/forms/support', { method: 'POST', body: JSON.stringify({ ...support, email: `rl${i}@example.com`, elapsedMs: 5000 }), headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.77' } });
      statuses.push((await POST(req, { params: Promise.resolve({ kind: 'support' }) })).status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 201)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });
});

describe('Google accounts and the profile step', () => {
  const facts = (over: Partial<AuthFacts> = {}): AuthFacts => ({ signedIn: true, emailConfirmed: true, phoneVerified: false, primarySignIn: true, profileComplete: true, smsVerified: false, ...over });
  it('a Google session is a primary sign-in; links and recovery are not', () => {
    expect(isPrimarySignIn(['oauth'])).toBe(true);
    expect(isPrimarySignIn(['password'])).toBe(true);
    expect(isPrimarySignIn(['otp'])).toBe(false);
    expect(isPrimarySignIn(['recovery'])).toBe(false);
  });
  it('a first Google sign-in must add phone, password, country and terms before anything opens', () => {
    const google = profileFactsOf({ identities: [{ provider: 'google' }], app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: { full_name: 'Asha' } });
    expect(profileMissing(google).sort()).toEqual(['country', 'password', 'phone', 'terms']);
    expect(workspaceGate(facts({ profileComplete: false }), false)).toBe('profile');
    expect(workspaceGate(facts({ profileComplete: false }), true)).toBe('profile');
    // user_metadata cannot fake the password or the terms: those are read from server-written app_metadata only
    const faked = profileFactsOf({ identities: [{ provider: 'google' }], user_metadata: { full_name: 'Asha', phone: '+919876543210', country: 'India', password_set: true, terms_accepted_at: '2026-10-07' } });
    expect(profileMissing(faked).sort()).toEqual(['password', 'terms']);
    const done = profileFactsOf({ identities: [{ provider: 'google' }], user_metadata: { name: 'Asha Rao', phone: '+91 98765 43210', country: 'India' }, app_metadata: { inrgift: { password_set: true, terms_accepted_at: '2026-10-07T00:00:00Z' } } });
    expect(profileMissing(done)).toEqual([]);
  });
  it('a first Apple sign-in without a shared name must also give the name; a relay address is a normal email', () => {
    const apple = profileFactsOf({ identities: [{ provider: 'apple' }], app_metadata: { provider: 'apple', providers: ['apple'] }, user_metadata: { email: 'x1@privaterelay.appleid.com' } });
    expect(profileMissing(apple).sort()).toEqual(['country', 'name', 'password', 'phone', 'terms']);
    const blank = profileFactsOf({ identities: [{ provider: 'apple' }], user_metadata: { full_name: '   ' } });
    expect(profileMissing(blank)).toContain('name');
    const named = profileFactsOf({ identities: [{ provider: 'apple' }], user_metadata: { full_name: 'Riya Mehta', phone: '+919876543210', country: 'India' }, app_metadata: { inrgift: { password_set: true, terms_accepted_at: '2026-10-07T00:00:00Z' } } });
    expect(profileMissing(named)).toEqual([]);
  });
  it('email + password accounts (also when Google is linked) need nothing more; SMS stays a later step', () => {
    const linked = profileFactsOf({ identities: [{ provider: 'email' }, { provider: 'google' }], user_metadata: { phone: '+919876543210', country: 'India' } });
    expect(profileMissing(linked)).toEqual([]);
    expect(workspaceGate(facts(), false)).toBe('ok');
    expect(workspaceGate(facts(), true)).toBe('verify-phone');
  });
});

describe('/auth/callback (Google and email links)', () => {
  const call = async (qs: string) => {
    const { GET } = await import('@/app/auth/callback/route');
    const r = await GET(new NextRequest(`http://localhost/auth/callback?${qs}`));
    return { status: r.status, location: r.headers.get('location') ?? '' };
  };
  it('a cancelled or failed Google sign-in returns to /login with a message, keeping only a safe next', async () => {
    const a = await call('flow=oauth&error=access_denied&error_description=denied&next=%2Fmarkets');
    expect(a.status).toBe(307);
    expect(a.location).toBe('http://localhost/login?error=oauth&next=%2Fmarkets');
    for (const evil of ['https%3A%2F%2Fevil.example', '%2F%2Fevil.example', 'javascript%3Aalert(1)', 'data%3Atext%2Fhtml%2Cx']) {
      const r = await call(`flow=oauth&error=server_error&next=${evil}`);
      expect(r.location, evil).toBe('http://localhost/login?error=oauth');
    }
  });
  it('without a code (or without Supabase) nothing is exchanged', async () => {
    expect((await call('flow=oauth&next=%2Fapp')).location).toBe('http://localhost/login?error=oauth&next=%2Fapp');
    expect((await call('flow=oauth&provider=apple&error=access_denied')).location).toBe('http://localhost/login?error=oauth&provider=apple');
    expect((await call('flow=oauth&provider=evil&error=access_denied')).location).toBe('http://localhost/login?error=oauth');
    expect((await call('flow=signup')).location).toBe('http://localhost/login?error=link');
  });
});

describe('Google sign-in availability', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
  it('follows Supabase: shown only when the Google provider is enabled there', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example-project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', '');
    const g = await import('@/features/auth/oauth-providers');
    const settings = (google: boolean) => (async () => new Response(JSON.stringify({ external: { google, email: true } }), { status: 200 })) as unknown as typeof fetch;
    expect(await g.googleSignInAvailable(settings(true))).toBe(true);
    g.resetGoogleCache();
    expect(await g.googleSignInAvailable(settings(false))).toBe(false);
    g.resetGoogleCache();
    expect(await g.googleSignInAvailable((async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toBe(false);
    g.resetGoogleCache();
    vi.stubEnv('GOOGLE_SIGN_IN', 'off');
    expect(await g.googleSignInAvailable(settings(true))).toBe(false);
  });
  it('Apple follows Supabase too, independently of Google', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example-project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', '');
    const g = await import('@/features/auth/oauth-providers');
    const settings = (external: Record<string, boolean>) => (async () => new Response(JSON.stringify({ external }), { status: 200 })) as unknown as typeof fetch;
    expect(await g.oauthAvailability(settings({ google: false, apple: true }))).toEqual({ google: false, apple: true });
    g.resetOAuthCache();
    expect(await g.oauthAvailability(settings({ google: true }))).toEqual({ google: true, apple: false });
    g.resetOAuthCache();
    expect(await g.oauthAvailability((async () => new Response('{}', { status: 500 })) as unknown as typeof fetch)).toEqual({ google: false, apple: false });
    g.resetOAuthCache();
    vi.stubEnv('APPLE_SIGN_IN', 'off');
    expect(await g.oauthAvailability(settings({ google: true, apple: true }))).toEqual({ google: true, apple: false });
  });
  it('the profile completion API refuses when Supabase is not configured', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { POST } = await import('@/app/api/auth/complete-profile/route');
    const r = await POST(new NextRequest('http://localhost/api/auth/complete-profile', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } }));
    expect(r.status).toBe(503);
  });
});
