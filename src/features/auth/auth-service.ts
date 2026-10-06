'use client';
import { DEMO_SESSION_COOKIE, isSupabaseConfigured } from '@/lib/config';
import { supabaseBrowser } from '@/supabase/client';

export interface AuthUser { id: string; email: string | null; phone: string | null; name: string; emailVerified: boolean; phoneVerified: boolean; mfaEnrolled: boolean }
export class AuthError extends Error { constructor(public code: 'INVALID' | 'RATE_LIMITED' | 'EXPIRED' | 'WEAK_PASSWORD' | 'UNKNOWN', message: string) { super(message); } }
export interface MfaEnrollment { factorId: string; secret: string; qr?: string }
export interface SecurityEvent { at: string; label: string }

/** Auth contract used by every form. Two implementations: Supabase (production) and a local demo. */
export interface AuthAdapter {
  readonly mode: 'supabase' | 'demo';
  getUser(): Promise<AuthUser | null>;
  onChange(cb: () => void): () => void;
  signUp(input: { email: string; password: string; name: string; country: string }): Promise<void>;
  signIn(email: string, password: string): Promise<{ mfaRequired: boolean }>;
  /** Demo only: stands in for clicking the emailed link. */
  confirmEmail?(): Promise<void>;
  resendEmail(email: string): Promise<void>;
  sendPhoneOtp(phone: string, purpose: 'login' | 'verify'): Promise<void>;
  verifyPhoneOtp(phone: string, code: string, purpose: 'login' | 'verify'): Promise<{ mfaRequired: boolean }>;
  resetPassword(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  mfaEnroll(): Promise<MfaEnrollment>;
  mfaVerify(factorId: string, code: string): Promise<void>;
  mfaFactorId(): Promise<string | null>;
  mfaUnenroll(factorId: string): Promise<void>;
  updateName(name: string): Promise<void>;
  activity(): Promise<SecurityEvent[]>;
  signOut(): Promise<void>;
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return 'Use at least 10 characters.';
  if (!/\d/.test(pw)) return 'Add at least one number.';
  if (!/[^\w\s]/.test(pw)) return 'Add at least one symbol.';
  return null;
}
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const isPhone = (v: string) => /^\+[1-9]\d{7,14}$/.test(v.replace(/[\s-]/g, ''));
export const normalizePhone = (v: string) => v.replace(/[\s-]/g, '');

/* ------------------------------ Supabase ------------------------------ */
function friendly(e: { message?: string; status?: number; code?: string } | null): AuthError {
  const m = (e?.message ?? '').toLowerCase();
  if (e?.status === 429 || m.includes('rate limit') || m.includes('too many')) return new AuthError('RATE_LIMITED', 'Too many attempts. Wait a minute, then try again.');
  if (m.includes('expired') || e?.code === 'otp_expired') return new AuthError('EXPIRED', 'That code or link has expired. Request a new one.');
  if (m.includes('invalid login') || m.includes('invalid') || m.includes('token')) return new AuthError('INVALID', 'Those details do not match. Check them and try again.');
  if (m.includes('password')) return new AuthError('WEAK_PASSWORD', 'Choose a stronger password.');
  return new AuthError('UNKNOWN', 'That did not work. Try again in a moment.');
}
const origin = () => window.location.origin;
const supabaseAdapter = (): AuthAdapter => {
  const sb = supabaseBrowser();
  const needsMfa = async () => { const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel(); return data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2'; };
  const totp = async () => (await sb.auth.mfa.listFactors()).data?.totp.find((f) => f.status === 'verified') ?? null;
  return {
    mode: 'supabase',
    async getUser() {
      const { data } = await sb.auth.getUser();
      const u = data.user;
      if (!u) return null;
      return { id: u.id, email: u.email ?? null, phone: u.phone ?? null, name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Account', emailVerified: Boolean(u.email_confirmed_at), phoneVerified: Boolean(u.phone_confirmed_at), mfaEnrolled: Boolean(await totp()) };
    },
    onChange(cb) { const { data } = sb.auth.onAuthStateChange(() => cb()); return () => data.subscription.unsubscribe(); },
    async signUp({ email, password, name, country }) { const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name, country }, emailRedirectTo: `${origin()}/auth/callback?next=/verify-phone` } }); if (error) throw friendly(error); },
    async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw friendly(error); return { mfaRequired: await needsMfa() }; },
    async resendEmail(email) { const { error } = await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${origin()}/auth/callback?next=/verify-phone` } }); if (error) throw friendly(error); },
    async sendPhoneOtp(phone, purpose) { const { error } = purpose === 'login' ? await sb.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } }) : await sb.auth.updateUser({ phone }); if (error) throw friendly(error); },
    async verifyPhoneOtp(phone, code, purpose) {
      const { error } = await sb.auth.verifyOtp({ phone, token: code, type: purpose === 'login' ? 'sms' : 'phone_change' });
      if (error) throw friendly(error);
      // profiles.phone_verified mirrors auth.users.phone_confirmed_at via a database trigger (migration 0005); the client never writes it.
      return { mfaRequired: await needsMfa() };
    },
    async resetPassword(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/auth/callback?next=/reset-password` }); if (error) throw friendly(error); },
    async updatePassword(password) { const { error } = await sb.auth.updateUser({ password }); if (error) throw friendly(error); },
    async mfaEnroll() { const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `INRGIFT ${Date.now()}` }); if (error || !data) throw friendly(error); return { factorId: data.id, secret: data.totp.secret, qr: data.totp.qr_code }; },
    async mfaVerify(factorId, code) { const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code }); if (error) throw friendly(error); },
    async mfaFactorId() { return (await totp())?.id ?? null; },
    async mfaUnenroll(factorId) { const { error } = await sb.auth.mfa.unenroll({ factorId }); if (error) throw friendly(error); },
    async updateName(name) { const { data, error } = await sb.auth.updateUser({ data: { full_name: name } }); if (error) throw friendly(error); if (data.user) await sb.from('profiles').update({ full_name: name }).eq('user_id', data.user.id); },
    async activity() { const { data } = await sb.auth.getUser(); const u = data.user; return u ? [{ at: u.last_sign_in_at ?? u.created_at, label: 'Signed in on this device' }, { at: u.created_at, label: 'Account created' }] : []; },
    async signOut() { await sb.auth.signOut(); },
  };
};

/* -------------------------------- Demo -------------------------------- */
const KEY = 'inrgift.demo.auth';
export const DEMO_CODE = '123456';
interface DemoState { user: AuthUser | null; remembered?: AuthUser | null; pendingMfa: boolean; attempts: number; lockedUntil: number; events: SecurityEvent[] }
const listeners = new Set<() => void>();
const read = (): DemoState => { try { return { user: null, pendingMfa: false, attempts: 0, lockedUntil: 0, events: [], ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return { user: null, pendingMfa: false, attempts: 0, lockedUntil: 0, events: [] }; } };
const write = (s: DemoState) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  const signedIn = Boolean(s.user) && !s.pendingMfa;
  document.cookie = `${DEMO_SESSION_COOKIE}=${signedIn ? '1' : ''}; path=/; SameSite=Lax; max-age=${signedIn ? 60 * 60 * 24 * 7 : 0}`;
  listeners.forEach((l) => l());
};
const log = (s: DemoState, label: string) => { s.events = [{ at: new Date().toISOString(), label }, ...s.events].slice(0, 20); };
/** Shared attempt limiter: five wrong codes locks verification for one minute. */
function checkCode(s: DemoState, code: string) {
  if (s.lockedUntil > Date.now()) throw new AuthError('RATE_LIMITED', `Too many attempts. Try again in ${Math.ceil((s.lockedUntil - Date.now()) / 1000)} seconds.`);
  if (code !== DEMO_CODE) {
    s.attempts += 1;
    if (s.attempts >= 5) { s.attempts = 0; s.lockedUntil = Date.now() + 60_000; }
    write(s);
    throw new AuthError('INVALID', `That code is not right. In demo mode the code is ${DEMO_CODE}.`);
  }
  s.attempts = 0;
}
const demoAdapter = (): AuthAdapter => ({
  mode: 'demo',
  async getUser() { const s = read(); return s.pendingMfa ? null : s.user; },
  onChange(cb) { listeners.add(cb); return () => { listeners.delete(cb); }; },
  async signUp({ email, name }) { const s = read(); s.user = { id: 'demo-user', email, phone: null, name, emailVerified: false, phoneVerified: false, mfaEnrolled: false }; s.pendingMfa = false; log(s, 'Account created'); write(s); },
  async signIn(email) {
    const s = read();
    const known = s.user ?? s.remembered ?? null;
    s.user = known && known.email === email ? known : { id: 'demo-user', email, phone: '+919800000000', name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), emailVerified: true, phoneVerified: true, mfaEnrolled: false };
    s.pendingMfa = s.user.mfaEnrolled;
    log(s, 'Signed in with email and password');
    write(s);
    return { mfaRequired: s.pendingMfa };
  },
  async confirmEmail() { const s = read(); if (s.user) { s.user.emailVerified = true; log(s, 'Email verified'); write(s); } },
  async resendEmail() {},
  async sendPhoneOtp(_phone, purpose) { const s = read(); if (s.lockedUntil > Date.now()) throw new AuthError('RATE_LIMITED', 'Too many attempts. Wait a minute, then try again.'); if (purpose === 'login' && !s.user && !s.remembered) throw new AuthError('INVALID', 'No account uses that number. Create an account first.'); },
  async verifyPhoneOtp(phone, code, purpose) {
    const s = read();
    checkCode(s, code);
    if (purpose === 'login' && !s.user) s.user = s.remembered ?? null;
    if (!s.user) throw new AuthError('INVALID', 'No account uses that number.');
    s.user.phone = phone; s.user.phoneVerified = true;
    if (purpose === 'login') s.pendingMfa = s.user.mfaEnrolled;
    log(s, purpose === 'login' ? 'Signed in with phone code' : 'Phone verified');
    write(s);
    return { mfaRequired: s.pendingMfa };
  },
  async resetPassword() {},
  async updatePassword() { const s = read(); log(s, 'Password changed'); write(s); },
  async mfaEnroll() { return { factorId: 'demo-totp', secret: 'JBSWY3DPEHPK3PXP' }; },
  async mfaVerify(_id, code) { const s = read(); checkCode(s, code); if (s.user) { const first = !s.user.mfaEnrolled; s.user.mfaEnrolled = true; s.pendingMfa = false; log(s, first ? 'Authenticator app enrolled' : 'Two-step verification passed'); } write(s); },
  async mfaFactorId() { return read().user?.mfaEnrolled ? 'demo-totp' : null; },
  async mfaUnenroll() { const s = read(); if (s.user) { s.user.mfaEnrolled = false; log(s, 'Authenticator app removed'); write(s); } },
  async updateName(name) { const s = read(); if (s.user) { s.user.name = name; write(s); } },
  async activity() { return read().events; },
  async signOut() { const s = read(); s.pendingMfa = false; const keep = s.user; log(s, 'Signed out'); localStorage.setItem(KEY, JSON.stringify({ ...s, user: null, remembered: keep ?? s.remembered })); document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; max-age=0`; listeners.forEach((l) => l()); },
});

let adapter: AuthAdapter | null = null;
export function getAuth(): AuthAdapter { adapter ??= isSupabaseConfigured ? supabaseAdapter() : demoAdapter(); return adapter; }
