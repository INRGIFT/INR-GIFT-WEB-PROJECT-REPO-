import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Sign-up step 2 (six-digit email code) and the account details in the demo adapter, which mirrors production rules:
 * the code confirms the email but opens no session (the password or Google does), wrong codes are counted, and the
 * code is never written to browser storage. Production uses Supabase verifyOtp(type 'email') with the same rules.
 */
vi.mock('@/lib/config', async (orig) => ({ ...(await orig<typeof import('@/lib/config')>()), authMode: 'demo', isSupabaseConfigured: false }));

class MemoryStorage { private m = new Map<string, string>(); getItem(k: string) { return this.m.get(k) ?? null; } setItem(k: string, v: string) { this.m.set(k, String(v)); } removeItem(k: string) { this.m.delete(k); } clear() { this.m.clear(); } dump() { return JSON.stringify([...this.m]); } }
const local = new MemoryStorage(), session = new MemoryStorage();
vi.stubGlobal('localStorage', local); vi.stubGlobal('sessionStorage', session);
vi.stubGlobal('document', { cookie: '' }); vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
beforeEach(() => { local.clear(); session.clear(); });

const PASSWORD = 'research-2026!';
const signUp = async () => {
  const { getAuth } = await import('@/features/auth/auth-service');
  const auth = getAuth();
  await auth.signUp({ name: 'Kisna Soni', email: 'kisna@example.com', phone: '+91 98765 43210', password: PASSWORD, country: 'India' });
  return auth;
};

describe('email verification code (sign-up step 2)', () => {
  it('only six digits are accepted, before anything is checked', async () => {
    const auth = await signUp();
    for (const bad of ['12345', '1234567', 'abcdef', '12 34 56', '']) await expect(auth.verifyEmailOtp('kisna@example.com', bad)).rejects.toMatchObject({ code: 'INVALID', message: 'Enter the 6-digit code from the email.' });
  });
  it('a wrong code is refused with the exact message and the account stays unverified', async () => {
    const auth = await signUp();
    await expect(auth.verifyEmailOtp('kisna@example.com', '000000')).rejects.toMatchObject({ code: 'INVALID', message: 'Incorrect verification code. Check the code in your email and try again.' });
    await expect(auth.signIn('kisna@example.com', PASSWORD)).rejects.toMatchObject({ code: 'EMAIL_UNCONFIRMED' });
  });
  it('the correct code verifies the email but opens no session; the password then signs in', async () => {
    const { DEMO_CODE } = await import('@/features/auth/auth-service');
    const auth = await signUp();
    await auth.verifyEmailOtp('kisna@example.com', DEMO_CODE);
    expect(await auth.getUser()).toBeNull();
    expect(await auth.signIn('kisna@example.com', PASSWORD)).toBe('ok');
    expect((await auth.getUser())?.emailVerified).toBe(true);
  });
  it('five wrong codes lock the code until a new one is requested', async () => {
    const auth = await signUp();
    for (let i = 0; i < 5; i++) await expect(auth.verifyEmailOtp('kisna@example.com', '111111')).rejects.toMatchObject({ code: 'INVALID' });
    await expect(auth.verifyEmailOtp('kisna@example.com', '123456')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    await auth.resendEmail('kisna@example.com');
    await expect(auth.verifyEmailOtp('kisna@example.com', '123456')).resolves.toBeUndefined();
  });
  it('the code is never stored in the browser', async () => {
    const { DEMO_CODE } = await import('@/features/auth/auth-service');
    const auth = await signUp();
    await auth.verifyEmailOtp('kisna@example.com', '590417').catch(() => {});
    await auth.verifyEmailOtp('kisna@example.com', DEMO_CODE);
    const stored = local.dump() + session.dump();
    expect(stored).not.toContain('590417');
    expect(stored).not.toContain(DEMO_CODE);
  });
});

describe('account details and GIFT ID (demo adapter)', () => {
  it('a new account has one GIFT ID in the production format, the same on every read', async () => {
    const { DEMO_CODE } = await import('@/features/auth/auth-service');
    const { GIFT_ID_PATTERN } = await import('@/features/account/types');
    const auth = await signUp();
    expect(await auth.getProfile()).toBeNull(); // no session yet
    await auth.verifyEmailOtp('kisna@example.com', DEMO_CODE);
    await auth.signIn('kisna@example.com', PASSWORD);
    const p1 = await auth.getProfile(), p2 = await auth.getProfile();
    expect(p1?.giftId).toMatch(GIFT_ID_PATTERN);
    expect(p2?.giftId).toBe(p1?.giftId);
    expect(p1).toMatchObject({ name: 'Kisna Soni', email: 'kisna@example.com', country: 'India', emailVerified: true, passwordSet: true });
    expect(JSON.stringify(p1)).not.toContain(PASSWORD);
    expect(Object.keys(p1!)).not.toContain('pw');
  });
  it('two accounts never share a GIFT ID', async () => {
    const { DEMO_CODE, getAuth } = await import('@/features/auth/auth-service');
    const auth = await signUp();
    await auth.signUp({ name: 'Ravi Iyer', email: 'ravi@example.com', phone: '+91 91234 56789', password: PASSWORD, country: 'India' });
    const ids: string[] = [];
    for (const e of ['kisna@example.com', 'ravi@example.com']) { await auth.verifyEmailOtp(e, DEMO_CODE); await auth.signIn(e, PASSWORD); ids.push((await getAuth().getProfile())!.giftId!); await auth.signOut(); }
    expect(new Set(ids).size).toBe(2);
  });
});

describe('workspace greeting', () => {
  it('always says Hola AMIGO, with the first name when known', async () => {
    const { greeting } = await import('@/features/workspace/greeting');
    expect(greeting('Kisna Soni')).toBe('Hola AMIGO, Kisna');
    expect(greeting('  Asha  ')).toBe('Hola AMIGO, Asha');
    expect(greeting('')).toBe('Hola AMIGO');
    expect(greeting(null)).toBe('Hola AMIGO');
    expect(greeting('Kisna')).not.toMatch(/Good (morning|afternoon|evening)/);
  });
});
