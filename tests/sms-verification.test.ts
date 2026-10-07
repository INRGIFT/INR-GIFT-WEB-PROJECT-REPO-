import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerSession } from '@/features/auth/server-facts';
import { workspaceGate } from '@/features/auth/policy';
import { completeSms, SmsError, startSms, type Challenge, type SmsStore } from '@/services/auth/sms-verification';
import type { OtpCheck, SmsOtpProvider } from '@/services/providers/twofactor';

const CODE = '482913';
function session(over: Partial<ServerSession> = {}, facts: Partial<ServerSession['facts']> = {}): ServerSession {
  const f = { signedIn: true, emailConfirmed: true, phoneVerified: false, passwordSession: true, smsVerified: false, ...facts };
  const s: ServerSession = { userId: 'u1', sessionId: 's1', email: 'asha@example.com', amr: ['password'], emailConfirmed: f.emailConfirmed, phoneConfirmed: f.phoneVerified, phone: f.phoneVerified ? '+919876543210' : null, signupPhone: '+919876543210', smsVerified: f.smsVerified, facts: f, gate: workspaceGate(f), ...over };
  return s;
}
function memoryStore(taken = new Set<string>()) {
  const rows = new Map<string, Challenge>();
  const confirmed: Record<string, string> = {};
  const stepUps: [string, string][] = [];
  let n = 0;
  const store: SmsStore = {
    async recentChallenges(userId, since) { return [...rows.values()].filter((r) => r.user_id === userId && new Date(r.created_at) >= since); },
    async createChallenge(row) { const id = `00000000-0000-0000-0000-${String(++n).padStart(12, '0')}`; rows.set(id, { ...row, id, attempts: 0, created_at: new Date(now).toISOString(), consumed_at: null }); return { id }; },
    async getChallenge(id) { return rows.get(id) ?? null; },
    async bumpAttempts(id) { const r = rows.get(id)!; r.attempts += 1; return r.attempts; },
    async consume(id) { const r = rows.get(id)!; if (r.consumed_at) return false; r.consumed_at = new Date(now).toISOString(); return true; },
    async phoneAvailable(p) { return !taken.has(p.replace(/\D/g, '')); },
    async confirmPhone(userId, p) { if (taken.has(p.replace(/\D/g, ''))) return 'taken'; confirmed[userId] = p; return 'ok'; },
    async recordStepUp(sid, uid) { stepUps.push([sid, uid]); },
  };
  return { store, rows, confirmed, stepUps };
}
function fakeSms(results: OtpCheck[] = []): SmsOtpProvider & { sent: string[] } {
  const sent: string[] = [];
  return { sent, async sendOtp(p) { sent.push(p); return { sessionId: `2f-${sent.length}` }; }, async verifyOtp(_s, code) { return results.shift() ?? (code === CODE ? 'matched' : 'mismatch'); } };
}
let now = Date.parse('2026-10-07T10:00:00Z');
const clock = () => new Date(now);
beforeEach(() => { now = Date.parse('2026-10-07T10:00:00Z'); });
afterEach(() => vi.restoreAllMocks());

describe('2Factor SMS verification (server core)', () => {
  it('phone verification at sign-up: send, verify, record the number and this session', async () => {
    const m = memoryStore(), sms = fakeSms();
    const r = await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    expect(sms.sent).toEqual(['+919876543210']);
    expect(r.phone).toBe('+91 ••••• 210');
    expect(JSON.stringify(r)).not.toContain('2f-1'); // the 2Factor session id never reaches the browser
    const done = await completeSms(session(), r.challengeId, CODE, { store: m.store, sms, now: clock });
    expect(done.purpose).toBe('signup');
    expect(m.confirmed.u1).toBe('+919876543210');
    expect(m.stepUps).toEqual([['s1', 'u1']]);
  });
  it('SMS at sign-in uses the verified number on record, never a number from the request', async () => {
    const m = memoryStore(), sms = fakeSms();
    await startSms(session({}, { phoneVerified: true }), 'login', '+15550001111', { store: m.store, sms, now: clock });
    expect(sms.sent).toEqual(['+919876543210']);
  });
  it('invalid OTP is rejected and nothing is recorded', async () => {
    const m = memoryStore(), sms = fakeSms();
    const r = await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    await expect(completeSms(session(), r.challengeId, '000000', { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'INVALID_CODE' });
    expect(m.confirmed).toEqual({}); expect(m.stepUps).toEqual([]);
  });
  it('expired OTP: by INRGIFT time limit and by 2Factor', async () => {
    const m = memoryStore(), sms = fakeSms();
    const r = await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    now += 11 * 60_000;
    await expect(completeSms(session(), r.challengeId, CODE, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'EXPIRED' });
    const m2 = memoryStore(), sms2 = fakeSms(['expired']);
    const r2 = await startSms(session(), 'signup', null, { store: m2.store, sms: sms2, now: clock });
    await expect(completeSms(session(), r2.challengeId, CODE, { store: m2.store, sms: sms2, now: clock })).rejects.toMatchObject({ code: 'EXPIRED' });
  });
  it('replay: a code that worked cannot be used again', async () => {
    const m = memoryStore(), sms = fakeSms();
    const r = await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    await completeSms(session(), r.challengeId, CODE, { store: m.store, sms, now: clock });
    await expect(completeSms(session(), r.challengeId, CODE, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('cross-user and cross-session use of a challenge is refused', async () => {
    const m = memoryStore(), sms = fakeSms();
    const r = await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    await expect(completeSms(session({ userId: 'attacker' }), r.challengeId, CODE, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(completeSms(session({ sessionId: 'other-session' }), r.challengeId, CODE, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(m.stepUps).toEqual([]);
  });
  it('five wrong codes lock the challenge', async () => {
    const m = memoryStore(), sms = fakeSms();
    const r = await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    for (let i = 0; i < 4; i++) await expect(completeSms(session(), r.challengeId, '111111', { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'INVALID_CODE' });
    await expect(completeSms(session(), r.challengeId, '111111', { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'LOCKED' });
    await expect(completeSms(session(), r.challengeId, CODE, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'LOCKED' });
  });
  it('resend cooldown per session and a send cap per account', async () => {
    const m = memoryStore(), sms = fakeSms();
    await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    await expect(startSms(session(), 'signup', null, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'COOLDOWN' });
    for (let i = 0; i < 4; i++) { now += 31_000; await startSms(session(), 'signup', null, { store: m.store, sms, now: clock }); }
    now += 31_000;
    await expect(startSms(session(), 'signup', null, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'TOO_MANY' });
  });
  it('a used code does not hold up the next step (cooldown applies only while a code is pending)', async () => {
    const m = memoryStore(), sms = fakeSms();
    const r = await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    await completeSms(session(), r.challengeId, CODE, { store: m.store, sms, now: clock });
    const verified = session({}, { phoneVerified: true, smsVerified: true });
    await expect(startSms(verified, 'change', '+919000000002', { store: m.store, sms, now: clock })).resolves.toMatchObject({ purpose: 'change' });
  });
  it('a number held by another account cannot be verified', async () => {
    const m = memoryStore(new Set(['919876543210'])), sms = fakeSms();
    await expect(startSms(session(), 'signup', null, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'PHONE_TAKEN' });
    expect(sms.sent).toEqual([]);
  });
  it('purposes are checked against the session (no bypass with parameters)', async () => {
    const m = memoryStore(), sms = fakeSms();
    await expect(startSms(null, 'signup', null, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'NOT_SIGNED_IN' });
    await expect(startSms(session({}, { passwordSession: false }), 'signup', null, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
    await expect(startSms(session({}, { emailConfirmed: false }), 'signup', null, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
    await expect(startSms(session(), 'login', null, { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
    await expect(startSms(session({}, { phoneVerified: true }), 'change', '+919000000001', { store: m.store, sms, now: clock })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
    const ok = session({}, { phoneVerified: true, smsVerified: true });
    await startSms(ok, 'change', '+919000000001', { store: m.store, sms, now: clock });
    expect(sms.sent).toEqual(['+919000000001']);
  });
  it('password reset needs the SMS code; the recovery session never becomes a workspace session', async () => {
    const m = memoryStore(), sms = fakeSms();
    const recovery = session({ amr: ['otp'] }, { phoneVerified: true, passwordSession: false });
    const r = await startSms(recovery, 'reset', null, { store: m.store, sms, now: clock });
    await completeSms(recovery, r.challengeId, CODE, { store: m.store, sms, now: clock });
    expect(m.stepUps).toEqual([['s1', 'u1']]);
    expect(workspaceGate({ ...recovery.facts, smsVerified: true })).toBe('login');
  });
  it('provider failure is reported as PROVIDER and nothing is stored', async () => {
    const m = memoryStore();
    const broken: SmsOtpProvider = { async sendOtp() { throw new Error('2factor: UNAVAILABLE'); }, async verifyOtp() { return 'matched'; } };
    await expect(startSms(session(), 'signup', null, { store: m.store, sms: broken, now: clock })).rejects.toMatchObject({ code: 'PROVIDER' });
    expect(m.rows.size).toBe(0);
  });
  it('never logs OTP codes', async () => {
    const spies = [vi.spyOn(console, 'log'), vi.spyOn(console, 'error'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'info')];
    const m = memoryStore(), sms = fakeSms();
    const r = await startSms(session(), 'signup', null, { store: m.store, sms, now: clock });
    await completeSms(session(), r.challengeId, '000000', { store: m.store, sms, now: clock }).catch((e) => expect(e).toBeInstanceOf(SmsError));
    await completeSms(session(), r.challengeId, CODE, { store: m.store, sms, now: clock });
    const out = spies.flatMap((s) => s.mock.calls.flat()).map(String).join(' ');
    expect(out).not.toContain(CODE); expect(out).not.toContain('000000');
    expect(JSON.stringify([...m.rows.values()])).not.toContain(CODE);
  });
});
