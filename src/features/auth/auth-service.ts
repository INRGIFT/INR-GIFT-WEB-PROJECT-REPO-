'use client';
import { authMode, config, DEMO_SESSION_COOKIE, EMAIL_RESEND_SECONDS, emailOtpSeconds, smsSecondFactor } from '@/lib/config';
import type { AccountProfile } from '@/features/account/types';
import { supabaseBrowser } from '@/supabase/client';
import type { OAuthProvider } from './oauth-providers';
import { amrMethods, isPrimarySignIn, isPhone, normalizePhone, passwordProblem, profileFactsOf, profileMissing, workspaceGate, type AuthFacts, type Gate, type ProfileField } from './policy';

export { isEmail, isPhone, normalizePhone, passwordProblem } from './policy';
export type { AccountProfile } from '@/features/account/types';

/**
 * A signed-in account, at any stage. `gate` is the next step it must complete; only `gate === 'ok'` opens the
 * workspace. In production every field comes from Supabase (user record, verified JWT, the server-written SMS step-up
 * for this session); the browser never decides that anything is verified.
 */
export interface AuthUser {
  id: string; email: string | null; name: string;
  /** The verified number, else the number given at sign-up (not yet verified). */
  phone: string | null;
  emailVerified: boolean;
  /** The mobile number is verified (by an SMS code through 2Factor.in). */
  phoneVerified: boolean;
  /** This session passed an SMS code. */
  smsVerified: boolean;
  /** Sign-in methods on the account ("email", "google", "apple"). */
  providers: string[];
  /** What the profile still lacks (a first Google sign-in): completed on /complete-profile. */
  missing: ProfileField[];
  gate: Gate;
}
/** What /complete-profile sends. `password` and `terms` only when they are missing. */
export interface ProfileInput { name: string; phone: string; country: string; password?: string; terms?: boolean }
export type AuthErrorCode = 'INVALID' | 'RATE_LIMITED' | 'EXPIRED' | 'WEAK_PASSWORD' | 'DUPLICATE_EMAIL' | 'DUPLICATE_PHONE' | 'EMAIL_UNCONFIRMED' | 'SMS_REQUIRED' | 'NOT_CONFIGURED' | 'UNKNOWN';
export class AuthError extends Error { constructor(public code: AuthErrorCode, message: string, public retryAfter?: number) { super(message); } }
export type SmsPurpose = 'signup' | 'login' | 'reset' | 'change';
/** An SMS code sent through 2Factor.in. Only an opaque id and the masked number reach the browser. */
export interface PhoneChallenge { challengeId: string; phone: string; purpose: SmsPurpose }
export interface SecurityEvent { at: string; label: string }

/** Auth contract used by every form. Implementations: Supabase (production), demo (local simulation), off. */
export interface AuthAdapter {
  readonly mode: 'supabase' | 'demo' | 'off';
  /** The current session's account at any stage, or null when signed out. */
  getUser(): Promise<AuthUser | null>;
  onChange(cb: () => void): () => void;
  /** Creates the account (email + password, phone reserved). No session until the email is verified. */
  signUp(input: { name: string; email: string; phone: string; password: string; country: string; next?: string }): Promise<void>;
  /** Email + password. Returns the next step. */
  signIn(email: string, password: string): Promise<Gate>;
  /**
   * Google or Apple through Supabase OAuth: the browser leaves for the provider and returns to /auth/callback
   * (production). Never a substitute for the account model: a first social sign-in completes the profile (name when
   * the provider withheld it, mobile number, password, country, terms) before anything opens.
   */
  signInWithOAuth(provider: OAuthProvider, next?: string): Promise<void>;
  /** Saves the missing profile fields (server-checked in production). Returns the next step. */
  completeProfile(input: ProfileInput): Promise<Gate>;
  /**
   * Sign-up step 2: the six-digit code from the "Verify your INRGIFT email" message (Supabase Auth generates and checks
   * it: verifyOtp, type 'email'). Confirms the email. The session that verifyOtp opens is closed again at once: only
   * the password or Google opens an INRGIFT session (policy.ts), so step 3 signs in with the password.
   * The code is never stored, logged or put in a URL.
   */
  verifyEmailOtp(email: string, token: string): Promise<void>;
  /** Sends a new sign-up code (Supabase resend, type 'signup'); it replaces the previous one. */
  resendEmail(email: string, next?: string): Promise<void>;
  /** The signed-in account's details for the workspace and profile pages (GIFT ID included), read on the server. */
  getProfile(): Promise<AccountProfile | null>;
  /** Sends an SMS code (2Factor.in, through INRGIFT's server). `phone` only for signup (edited number) and change. */
  sendSms(purpose: SmsPurpose, phone?: string): Promise<PhoneChallenge>;
  /** Checks a code. On success the server records the verified number (signup/change) and this session's step-up. */
  verifySms(c: PhoneChallenge, code: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  /** Demo only: stands in for opening the emailed reset link (a recovery session, not a password session). */
  openRecoveryLink?(): Promise<boolean>;
  /** Server-checked: needs this session's SMS code when the account has a verified phone. Signs out other sessions. */
  updatePassword(password: string): Promise<void>;
  updateName(name: string): Promise<void>;
  activity(): Promise<SecurityEvent[]>;
  signOut(scope?: 'local' | 'global'): Promise<void>;
}

const build = (base: Omit<AuthUser, 'gate'>, primarySignIn: boolean): AuthUser => {
  const f: AuthFacts = { signedIn: true, emailConfirmed: base.emailVerified, phoneVerified: base.phoneVerified, primarySignIn, profileComplete: base.missing.length === 0, smsVerified: base.smsVerified };
  return { ...base, gate: workspaceGate(f) };
};

/* ------------------------------ Supabase ------------------------------ */
function friendly(e: { message?: string; status?: number; code?: string } | null): AuthError {
  const m = (e?.message ?? '').toLowerCase();
  if (e?.status === 429 || m.includes('rate limit') || m.includes('too many')) return new AuthError('RATE_LIMITED', 'Too many attempts. Wait a minute, then try again.');
  // The Send Email Hook refused or failed (e.g. a code length INRGIFT cannot accept): nothing was emailed.
  if (m.includes('hook') || m.includes('error sending') || m.includes('sending confirmation') || m.includes('email code length')) return new AuthError('UNKNOWN', 'We could not send your verification email just now. Try again in a few minutes, or write to support@inrgift.com.');
  if (e?.code === 'email_not_confirmed' || m.includes('email not confirmed')) return new AuthError('EMAIL_UNCONFIRMED', 'Verify your email address first with the 6-digit code we sent you.');
  if (e?.code === 'user_already_exists' || m.includes('already registered')) return new AuthError('DUPLICATE_EMAIL', 'An account already uses that email address. Sign in, or reset your password.');
  if (m.includes('expired') || e?.code === 'otp_expired') return new AuthError('EXPIRED', 'That link has expired. Request a new one.');
  if (e?.code === 'weak_password' || (m.includes('password') && !m.includes('invalid'))) return new AuthError('WEAK_PASSWORD', 'Choose a stronger password.');
  if (m.includes('invalid login') || m.includes('invalid')) return new AuthError('INVALID', 'Those details do not match. Check them and try again.');
  if (m.includes('database error')) return new AuthError('DUPLICATE_PHONE', 'That mobile number cannot be used. It may already belong to another account.');
  return new AuthError('UNKNOWN', 'That did not work. Try again in a moment.');
}
/** The four outcomes of a failed email-code check, worded for people (never a raw Supabase error). */
export const OTP_MESSAGES = {
  expired: 'This verification code has expired. Please request a new code.',
  invalid: 'The code is incorrect. Please check the email and try again.',
  rateLimited: 'Too many requests. Please wait before requesting another code.',
  unavailable: "We couldn't verify the code right now. Please try again.",
} as const;
/**
 * Supabase answers a wrong and an expired email code alike (otp_expired); the form tells them apart by the time the
 * code was sent (src/features/auth/otp-clock.ts). Rate limits and outages get their own messages.
 */
function otpError(e: { message?: string; status?: number; code?: string; name?: string } | null): AuthError {
  const m = (e?.message ?? '').toLowerCase();
  if (e?.status === 429 || m.includes('rate limit') || m.includes('too many') || e?.code === 'over_request_rate_limit' || e?.code === 'over_email_send_rate_limit') return new AuthError('RATE_LIMITED', OTP_MESSAGES.rateLimited);
  if (transient(e)) return new AuthError('UNKNOWN', OTP_MESSAGES.unavailable);
  if (e?.code === 'validation_failed') return new AuthError('INVALID', 'Enter the 6-digit code from the email.');
  if (e?.code === 'otp_expired' || m.includes('expired') || m.includes('invalid')) return new AuthError('INVALID', OTP_MESSAGES.invalid);
  return new AuthError('UNKNOWN', OTP_MESSAGES.unavailable);
}
/**
 * A refused verification email (sign-up or "Resend code"): Supabase's email limits (one per address per 60 s, and the
 * project-wide hourly cap) say so; everything else is the friendly default.
 */
function emailSendError(e: { message?: string; status?: number; code?: string } | null): AuthError {
  const m = (e?.message ?? '').toLowerCase();
  if (e?.status === 429 || m.includes('rate limit') || m.includes('too many') || m.includes('security purposes') || e?.code === 'over_email_send_rate_limit' || e?.code === 'over_request_rate_limit') return new AuthError('RATE_LIMITED', OTP_MESSAGES.rateLimited);
  return friendly(e);
}
/** Network trouble or a Supabase outage, as opposed to "no session" or "session expired/revoked". */
const transient = (e: { name?: string; status?: number } | null | undefined) => Boolean(e && (e.name === 'AuthRetryableFetchError' || (typeof e.status === 'number' && (e.status === 0 || e.status >= 500))));
const SERVER_CODES: Record<string, AuthErrorCode> = { COOLDOWN: 'RATE_LIMITED', TOO_MANY: 'RATE_LIMITED', LOCKED: 'RATE_LIMITED', EXPIRED: 'EXPIRED', NOT_FOUND: 'EXPIRED', INVALID_CODE: 'INVALID', INVALID_PHONE: 'INVALID', PHONE_TAKEN: 'DUPLICATE_PHONE', SMS_REQUIRED: 'SMS_REQUIRED', WEAK_PASSWORD: 'WEAK_PASSWORD', REJECTED: 'WEAK_PASSWORD', NOT_CONFIGURED: 'NOT_CONFIGURED', NOT_SIGNED_IN: 'INVALID', INVALID_INPUT: 'INVALID', DUPLICATE_PHONE: 'DUPLICATE_PHONE' };
/** Calls an INRGIFT auth route; errors arrive as safe { code, message } from the server. */
async function api<T>(path: string, body: unknown): Promise<T> {
  let r: Response;
  try { r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' }); }
  catch { throw new AuthError('UNKNOWN', 'That did not work. Check your connection and try again.'); }
  const j = (await r.json().catch(() => ({}))) as { data?: T; error?: { code?: string; message?: string; retryAfter?: number } };
  if (!r.ok || j.error) throw new AuthError(SERVER_CODES[j.error?.code ?? ''] ?? 'UNKNOWN', j.error?.message ?? 'That did not work. Try again in a moment.', j.error?.retryAfter);
  return j.data as T;
}
/** Origin for links Supabase sends people back to: the canonical site in production, never localhost there. */
const origin = () => (process.env.NODE_ENV === 'production' ? config.siteUrl.replace(/\/$/, '') : window.location.origin);
const nextQ = (next?: string) => (next && next !== '/app' ? `&next=${encodeURIComponent(next)}` : '');
let localSignOutAt = 0;
/** True for a few seconds after this tab asked to sign out (its own navigation follows; see session-context.tsx). */
export const signingOutHere = () => Date.now() - localSignOutAt < 5000;
/** Forget this tab's temporary auth state (the pending SMS challenge reference, see forms.tsx) when the session ends. */
const clearPending = () => { localSignOutAt = Date.now(); try { sessionStorage.removeItem('inrgift.sms.pending'); } catch { /* storage unavailable */ } };
/** Carries the return path through the emailed link (the email hook and /auth/confirm validate it again). */
const confirmRedirect = (next?: string) => `${origin()}/auth/callback?flow=signup${nextQ(next)}`;
async function phoneAvailable(phone: string): Promise<boolean> {
  const r = await fetch('/api/auth/phone-available', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
  if (r.status === 429) throw new AuthError('RATE_LIMITED', 'Too many attempts. Wait a minute, then try again.');
  if (!r.ok) throw new AuthError('UNKNOWN', 'That did not work. Try again in a moment.');
  return Boolean((await r.json()).available);
}
const supabaseAdapter = (): AuthAdapter => {
  const sb = supabaseBrowser();
  return {
    mode: 'supabase',
    async getUser() {
      // A network failure is not a sign-out: it throws, so the session context keeps the last known state and retries.
      const { data, error } = await sb.auth.getUser();
      if (transient(error)) throw new AuthError('UNKNOWN', 'Your session could not be checked. Check your connection.');
      const u = data.user;
      if (!u) return null;
      const { data: c, error: claimsError } = await sb.auth.getClaims();
      if (transient(claimsError)) throw new AuthError('UNKNOWN', 'Your session could not be checked. Check your connection.');
      const claims = c?.claims as { session_id?: string; amr?: unknown } | undefined;
      const { data: step } = smsSecondFactor && claims?.session_id ? await sb.from('sms_step_ups').select('session_id').eq('session_id', claims.session_id).maybeSingle() : { data: null };
      const phoneVerified = Boolean(u.phone_confirmed_at && u.phone);
      const profile = profileFactsOf(u);
      return build({
        id: u.id, email: u.email ?? null, name: (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'Account',
        phone: profile.phone, emailVerified: Boolean(u.email_confirmed_at), phoneVerified, smsVerified: Boolean(step),
        providers: profile.providers, missing: profileMissing(profile),
      }, isPrimarySignIn(amrMethods(claims?.amr)));
    },
    onChange(cb) { const { data } = sb.auth.onAuthStateChange(() => cb()); return () => data.subscription.unsubscribe(); },
    async signUp({ name, email, phone, password, country, next }) {
      const p = normalizePhone(phone);
      if (!isPhone(p)) throw new AuthError('INVALID', 'Enter the number with its country code.');
      // Number uniqueness is enforced from migration 0007 on, which ships with the SMS second factor.
      if (smsSecondFactor && !(await phoneAvailable(p))) throw new AuthError('DUPLICATE_PHONE', 'An account already uses that mobile number. Sign in, or use a different number.');
      // The number goes in the sign-up metadata; a database trigger reserves it (unique) when the user is created.
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name, country, phone: p }, emailRedirectTo: confirmRedirect(next) } });
      if (error) throw emailSendError(error);
      // With email confirmation on, Supabase answers an existing address with a user that has no identities.
      if (data.user && (data.user.identities?.length ?? 0) === 0) throw new AuthError('DUPLICATE_EMAIL', 'An account already uses that email address. Sign in, or reset your password.');
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw friendly(error);
      return (await this.getUser())?.gate ?? 'login';
    },
    async signInWithOAuth(provider, next) {
      // PKCE: Supabase redirects to the provider, then to /auth/callback?flow=oauth, which exchanges the code on the
      // server. Apple returns by form POST to Supabase (not to INRGIFT), so the same callback serves both.
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${origin()}/auth/callback?flow=oauth&provider=${provider}${nextQ(next)}`, ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}) } });
      if (error) throw new AuthError('UNKNOWN', `${provider === 'apple' ? 'Apple' : 'Google'} sign-in could not start. Try again, or use your email and password.`);
    },
    async completeProfile(input) {
      await api('/api/auth/complete-profile', { ...input, phone: normalizePhone(input.phone) });
      await sb.auth.refreshSession();
      return (await this.getUser())?.gate ?? 'login';
    },
    async resendEmail(email, next) {
      let error: Parameters<typeof emailSendError>[0];
      try { ({ error } = await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: confirmRedirect(next) } })); } catch { throw new AuthError('UNKNOWN', 'The code could not be sent right now. Check your connection and try again.'); }
      if (error) throw emailSendError(error);
    },
    async verifyEmailOtp(email, token) {
      if (!/^\d{6}$/.test(token)) throw new AuthError('INVALID', 'Enter the 6-digit code from the email.');
      let error: Parameters<typeof otpError>[0];
      try { ({ error } = await sb.auth.verifyOtp({ email, token, type: 'email' })); } catch { throw new AuthError('UNKNOWN', OTP_MESSAGES.unavailable); }
      if (error) throw otpError(error);
      // Email confirmed. Close the code's session: the account opens with the password (step 3), never a code alone.
      clearPending();
      await sb.auth.signOut({ scope: 'local' });
    },
    async getProfile() {
      let r: Response;
      try { r = await fetch('/api/v1/me', { credentials: 'same-origin', cache: 'no-store' }); } catch { throw new AuthError('UNKNOWN', 'Your account details could not load. Check your connection.'); }
      if (r.status === 401 || r.status === 403) return null;
      if (!r.ok) throw new AuthError('UNKNOWN', 'Your account details could not load. Try again in a moment.');
      return ((await r.json()) as { data: AccountProfile }).data;
    },
    async sendSms(purpose, phone) {
      const d = await api<{ challengeId: string; phone: string; purpose: SmsPurpose }>('/api/auth/sms/start', { purpose, ...(phone ? { phone: normalizePhone(phone) } : {}) });
      return { challengeId: d.challengeId, phone: d.phone, purpose: d.purpose };
    },
    async verifySms(c, code) { await api('/api/auth/sms/verify', { challengeId: c.challengeId, code }); },
    async resetPassword(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/auth/callback?flow=recovery` }); if (error) throw friendly(error); },
    async updatePassword(password) { await api('/api/auth/password', { password }); },
    async updateName(name) { const { data, error } = await sb.auth.updateUser({ data: { full_name: name } }); if (error) throw friendly(error); if (data.user) await sb.from('profiles').update({ full_name: name }).eq('user_id', data.user.id); },
    async activity() { const { data } = await sb.auth.getUser(); const u = data.user; return u ? [{ at: u.last_sign_in_at ?? u.created_at, label: 'Signed in on this device' }, { at: u.created_at, label: 'Account created' }] : []; },
    async signOut(scope = 'local') { clearPending(); await sb.auth.signOut({ scope }); },
  };
};

/* --------------------------------------------------------------------------------------------------------------
 * Demo: a browser-only simulation for development and automated tests (never a public deployment, see config.ts).
 * It follows the production rules so the journeys can be tested end to end: hashed password check, unique email and
 * phone, email confirmation, phone verification, an SMS code per session, code expiry, attempt limits and a resend
 * cooldown. The workspace cookie is set only when the shared workspaceGate() passes. It is not a security boundary.
 * ------------------------------------------------------------------------------------------------------------ */
const KEY = 'inrgift.demo.auth.v3';
/** The demo's code for every email and SMS step (demo builds only; production codes come from Supabase and 2Factor.in). */
export const DEMO_CODE = '123456';
/** Demo GIFT ID: same format as production (GIFT- + 8 Crockford base32 characters), random, made in this browser. */
const demoGiftId = () => { const a = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; const b = crypto.getRandomValues(new Uint8Array(8)); return `GIFT-${Array.from(b, (x) => a[x & 31]).join('')}`; };
interface DemoAccount {
  id: string; email: string; signupPhone: string; phone: string | null; name: string; pw: string | null; emailVerified: boolean;
  /** Demo GIFT ID, made in this browser (production: assigned by the database, migration 0008). */
  giftId?: string; createdAt?: string; codeAttempts?: number;
  /** When the current demo email code was issued (ms): codes expire after emailOtpSeconds, as in Supabase. */
  codeSentAt?: number;
  /** Signed up with email + password (missing on older demo state = true). */
  emailIdentity?: boolean; google?: boolean; apple?: boolean; country?: string; termsAt?: string;
}
/** The accounts a demo "Continue with Google" / "Continue with Apple" signs in as (no real provider in demo mode). */
export const DEMO_GOOGLE_EMAIL = 'google.user@example.com';
/** Apple's "Hide My Email" relay address, and no name: Apple shares a name only if the person chooses to. */
export const DEMO_APPLE_EMAIL = 'demo.relay@privaterelay.appleid.com';
interface DemoChallenge extends PhoneChallenge { phoneE164: string; issuedAt: number; attempts: number }
interface DemoState {
  accounts: DemoAccount[];
  session: { accountId: string; amr: string[]; smsVerified: boolean; lastSmsAt: number } | null;
  challenge: DemoChallenge | null;
  recoveryFor: string | null; lastSignup: string | null; events: SecurityEvent[];
}
/** A new empty state each time: a shared object would let pushed accounts and events leak between reads. */
const empty = (): DemoState => ({ accounts: [], session: null, challenge: null, recoveryFor: null, lastSignup: null, events: [] });
const listeners = new Set<() => void>();
const read = (): DemoState => { try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return empty(); } };
const current = (s: DemoState) => (s.session ? s.accounts.find((a) => a.id === s.session!.accountId) ?? null : null);
const toUser = (s: DemoState): AuthUser | null => {
  const a = current(s);
  if (!a || !s.session) return null;
  const providers = [...(a.emailIdentity !== false ? ['email'] : []), ...(a.google ? ['google'] : []), ...(a.apple ? ['apple'] : [])];
  const phone = a.phone ?? (a.signupPhone || null);
  const missing = profileMissing({ providers, name: a.name || null, phone, country: a.country ?? null, passwordSet: Boolean(a.pw), termsAcceptedAt: a.termsAt ?? null });
  return build({ id: a.id, email: a.email, name: a.name, phone, emailVerified: a.emailVerified, phoneVerified: Boolean(a.phone), smsVerified: s.session.smsVerified, providers, missing }, isPrimarySignIn(s.session.amr));
};
const write = (s: DemoState) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  const ok = toUser(s)?.gate === 'ok';
  document.cookie = `${DEMO_SESSION_COOKIE}=${ok ? '1' : ''}; path=/; SameSite=Lax; max-age=${ok ? 60 * 60 * 24 * 7 : 0}`;
  listeners.forEach((l) => l());
};
const log = (s: DemoState, label: string) => { s.events = [{ at: new Date().toISOString(), label }, ...s.events].slice(0, 20); };
const hash = async (pw: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`inrgift-demo:${pw}`)))).map((b) => b.toString(16).padStart(2, '0')).join('');
const phoneTaken = (s: DemoState, phone: string, self?: string) => s.accounts.some((a) => a.id !== self && (a.signupPhone === phone || a.phone === phone));
const mask = (p: string) => `${p.slice(0, 3)} ••••• ${p.slice(-3)}`;
const demoAdapter = (): AuthAdapter => ({
  mode: 'demo',
  async getUser() { return toUser(read()); },
  onChange(cb) {
    // Other tabs change the same storage; Supabase syncs tabs itself (BroadcastChannel), the demo follows `storage` events.
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
    listeners.add(cb); window.addEventListener('storage', onStorage);
    return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
  },
  async signUp({ name, email, phone, password, country }) {
    const s = read();
    const e = email.trim().toLowerCase(), p = normalizePhone(phone);
    if (!isPhone(p)) throw new AuthError('INVALID', 'Enter the number with its country code.');
    if (passwordProblem(password)) throw new AuthError('WEAK_PASSWORD', 'Choose a stronger password.');
    if (s.accounts.some((a) => a.email === e)) throw new AuthError('DUPLICATE_EMAIL', 'An account already uses that email address. Sign in, or reset your password.');
    if (phoneTaken(s, p)) throw new AuthError('DUPLICATE_PHONE', 'An account already uses that mobile number. Sign in, or use a different number.');
    const a: DemoAccount = { id: `demo-${s.accounts.length + 1}-${Date.now()}`, email: e, signupPhone: p, phone: null, name, pw: await hash(password), emailVerified: false, emailIdentity: true, giftId: demoGiftId(), createdAt: new Date().toISOString(), country, codeSentAt: Date.now() };
    s.accounts.push(a); s.lastSignup = a.id; s.session = null;
    log(s, 'Account created'); write(s);
  },
  async signIn(email, password) {
    const s = read();
    const a = s.accounts.find((x) => x.email === email.trim().toLowerCase());
    if (!a || !a.pw || a.pw !== (await hash(password))) throw new AuthError('INVALID', 'Those details do not match. Check them and try again.');
    if (!a.emailVerified) throw new AuthError('EMAIL_UNCONFIRMED', 'Verify your email address first with the 6-digit code we sent you.');
    s.session = { accountId: a.id, amr: ['password'], smsVerified: false, lastSmsAt: 0 }; s.challenge = null;
    log(s, 'Signed in with email and password'); write(s);
    return toUser(s)!.gate;
  },
  async signInWithOAuth(provider) {
    // Stands in for Google/Apple + Supabase: the provider's email arrives verified; an existing account with that
    // verified email gains the identity (Supabase automatic linking); otherwise a social-only account is created.
    // Apple: a relay address and no name, so profile completion asks for the name.
    const s = read();
    const email = provider === 'apple' ? DEMO_APPLE_EMAIL : DEMO_GOOGLE_EMAIL;
    let a = s.accounts.find((x) => x.email === email);
    if (a && !a.emailVerified) { a.emailIdentity = false; a.pw = null; } // like Supabase: unconfirmed identities are dropped
    if (!a) { a = { id: `demo-${provider[0]}-${Date.now()}`, email, signupPhone: '', phone: null, name: provider === 'apple' ? '' : 'Google User', pw: null, emailVerified: true, emailIdentity: false, giftId: demoGiftId(), createdAt: new Date().toISOString() }; s.accounts.push(a); }
    if (provider === 'apple') a.apple = true; else a.google = true;
    a.emailVerified = true;
    s.session = { accountId: a.id, amr: ['oauth'], smsVerified: false, lastSmsAt: 0 }; s.challenge = null;
    log(s, `Signed in with ${provider === 'apple' ? 'Apple' : 'Google'}`); write(s);
  },
  async completeProfile({ name, phone, country, password, terms }) {
    const s = read(); const a = current(s); const u = toUser(s);
    if (!a || !u || u.gate !== 'profile') throw new AuthError('INVALID', 'Sign in again to finish your profile.');
    const p = normalizePhone(phone);
    if (!isPhone(p)) throw new AuthError('INVALID', 'Enter the number with its country code.');
    if (phoneTaken(s, p, a.id)) throw new AuthError('DUPLICATE_PHONE', 'An account already uses that mobile number. Sign in, or use a different number.');
    if (u.missing.includes('password')) { if (!password || passwordProblem(password)) throw new AuthError('WEAK_PASSWORD', 'Choose a stronger password.'); a.pw = await hash(password); }
    if (u.missing.includes('terms')) { if (!terms) throw new AuthError('INVALID', 'Accept the terms to continue.'); a.termsAt = new Date().toISOString(); }
    a.name = name.trim() || a.name; a.signupPhone = p; a.country = country;
    log(s, 'Profile completed'); write(s);
    return toUser(s)!.gate;
  },
  async verifyEmailOtp(email, token) {
    const s = read();
    const a = s.accounts.find((x) => x.email === email.trim().toLowerCase());
    if (!/^\d{6}$/.test(token)) throw new AuthError('INVALID', 'Enter the 6-digit code from the email.');
    if (!a || a.emailVerified) throw new AuthError('INVALID', OTP_MESSAGES.invalid);
    if ((a.codeAttempts ?? 0) >= 5) throw new AuthError('RATE_LIMITED', OTP_MESSAGES.rateLimited);
    // Like Supabase Auth: a code older than the configured lifetime is refused, with the same answer as a wrong code.
    if (a.codeSentAt && Date.now() - a.codeSentAt > emailOtpSeconds * 1000) throw new AuthError('INVALID', OTP_MESSAGES.invalid);
    if (token !== DEMO_CODE) { a.codeAttempts = (a.codeAttempts ?? 0) + 1; write(s); throw new AuthError('INVALID', OTP_MESSAGES.invalid); }
    a.emailVerified = true; a.codeAttempts = 0;
    s.session = null; // like production: the code confirms the email; the password opens the session
    log(s, 'Email verified'); write(s);
  },
  async resendEmail(email) {
    const s = read(); const a = s.accounts.find((x) => x.email === email.trim().toLowerCase());
    // Like Supabase Auth: one email per address per EMAIL_RESEND_SECONDS; a new code replaces the old one.
    if (a?.codeSentAt && Date.now() - a.codeSentAt < EMAIL_RESEND_SECONDS * 1000) throw new AuthError('RATE_LIMITED', OTP_MESSAGES.rateLimited);
    if (a) { a.codeAttempts = 0; a.codeSentAt = Date.now(); write(s); }
  },
  async getProfile() {
    const s = read(); const a = current(s); const u = toUser(s);
    if (!a || !u) return null;
    if (!a.giftId) { a.giftId = demoGiftId(); a.createdAt ??= new Date().toISOString(); write(s); }
    return {
      giftId: a.giftId, name: a.name, email: a.email, phone: a.phone ?? (a.signupPhone || null), country: a.country ?? null,
      emailVerified: a.emailVerified, phoneVerified: Boolean(a.phone), providers: u.providers, passwordSet: Boolean(a.pw),
      createdAt: a.createdAt ?? null, lastSignInAt: null,
      session: { method: s.session?.amr.includes('oauth') ? 'oauth' : s.session?.amr.includes('password') ? 'password' : 'other', startedAt: null, tokenExpiresAt: null },
    };
  },
  async sendSms(purpose, phone) {
    const s = read(); const a = current(s); const u = toUser(s);
    if (!a || !s.session || !u) throw new AuthError('INVALID', 'Sign in with your email and password first.');
    const allowed = purpose === 'signup' ? u.gate === 'verify-phone' : purpose === 'login' ? u.gate === 'sms' : purpose === 'reset' ? Boolean(a.phone) : u.gate === 'ok';
    if (!allowed) throw new AuthError('INVALID', 'This step is not available for your account right now. Sign in again.');
    const target = purpose === 'login' || purpose === 'reset' ? a.phone! : normalizePhone(phone ?? a.signupPhone);
    if (!isPhone(target)) throw new AuthError('INVALID', 'Enter the number with its country code.');
    if ((purpose === 'signup' || purpose === 'change') && phoneTaken(s, target, a.id)) throw new AuthError('DUPLICATE_PHONE', 'That mobile number belongs to another account.');
    if (purpose === 'change' && target === a.phone) throw new AuthError('INVALID', 'Enter a different mobile number with its country code.');
    const wait = 30_000 - (Date.now() - s.session.lastSmsAt);
    if (wait > 0) throw new AuthError('RATE_LIMITED', 'A code was just sent. Wait a moment before asking for another.', Math.ceil(wait / 1000));
    s.challenge = { challengeId: `ch-${Date.now()}`, phone: mask(target), purpose, phoneE164: target, issuedAt: Date.now(), attempts: 0 };
    s.session.lastSmsAt = Date.now();
    write(s);
    return { challengeId: s.challenge.challengeId, phone: s.challenge.phone, purpose };
  },
  async verifySms(c, code) {
    const s = read(); const a = current(s);
    const ch = s.challenge;
    if (!a || !s.session || !ch || ch.challengeId !== c.challengeId) throw new AuthError('EXPIRED', 'That code is no longer valid. Send a new one.');
    if (Date.now() - ch.issuedAt > 10 * 60_000) throw new AuthError('EXPIRED', 'That code has expired. Send a new one.');
    if (ch.attempts >= 5) throw new AuthError('RATE_LIMITED', 'Too many wrong codes. Send a new one.');
    if (code !== DEMO_CODE) { ch.attempts += 1; write(s); throw new AuthError('INVALID', `That code is not right. In demo mode the code is ${DEMO_CODE}.`); }
    if (ch.purpose === 'signup' || ch.purpose === 'change') a.phone = ch.phoneE164;
    s.session.smsVerified = true; s.challenge = null; s.session.lastSmsAt = 0; // a used code does not hold up the next step
    log(s, ch.purpose === 'change' ? 'Mobile number changed' : ch.purpose === 'signup' ? 'Mobile number verified' : 'SMS code verified');
    write(s);
  },
  async resetPassword(email) { const s = read(); s.recoveryFor = s.accounts.find((a) => a.email === email.trim().toLowerCase())?.id ?? null; write(s); },
  async openRecoveryLink() {
    const s = read();
    if (!s.recoveryFor) return false;
    s.session = { accountId: s.recoveryFor, amr: ['otp'], smsVerified: false, lastSmsAt: 0 }; s.recoveryFor = null; // a recovery session, not a password session
    write(s); return true;
  },
  async updatePassword(password) {
    const s = read(); const a = current(s);
    if (!a || !s.session) throw new AuthError('INVALID', 'Sign in first.');
    if (passwordProblem(password)) throw new AuthError('WEAK_PASSWORD', 'Choose a stronger password.');
    if (a.phone && !s.session.smsVerified) throw new AuthError('SMS_REQUIRED', 'Confirm the code sent to your phone first.');
    a.pw = await hash(password); log(s, 'Password changed'); write(s);
  },
  async updateName(name) { const s = read(); const a = current(s); if (a) { a.name = name; write(s); } },
  async activity() { return read().events; },
  async signOut() { clearPending(); const s = read(); s.session = null; s.challenge = null; log(s, 'Signed out'); write(s); },
});

const offAdapter = (): AuthAdapter => {
  // Only a deployment with no Supabase settings at all reaches this (see authMode, src/lib/config.ts).
  const no = async (): Promise<never> => { throw new AuthError('NOT_CONFIGURED', 'Sign-in is not available on this site yet. Please email support@inrgift.com.'); };
  return { mode: 'off', getUser: async () => null, onChange: () => () => {}, signUp: no, signIn: no, signInWithOAuth: no, completeProfile: no, verifyEmailOtp: no, getProfile: async () => null, resendEmail: no, sendSms: no, verifySms: no, resetPassword: no, updatePassword: no, updateName: no, activity: async () => [], signOut: async () => {} };
};

let adapter: AuthAdapter | null = null;
export function getAuth(): AuthAdapter { adapter ??= authMode === 'supabase' ? supabaseAdapter() : authMode === 'demo' ? demoAdapter() : offAdapter(); return adapter; }
