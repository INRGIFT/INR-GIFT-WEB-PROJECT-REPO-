import type { ServerSession } from '@/features/auth/server-facts';
import { isPhone, normalizePhone } from '@/features/auth/policy';
import type { OtpCheck, SmsOtpProvider } from '@/services/providers/twofactor';

/**
 * SMS verification through 2Factor.in, server side. 2Factor generates and checks the code; INRGIFT stores only the
 * 2Factor session id (never the code) in a challenge bound to the user AND the Supabase session that asked for it.
 *
 * Purposes
 *   signup  first verification of the account's number   needs: password session, confirmed email, no verified phone
 *   login   the code at every sign-in                     needs: password session, confirmed email, verified phone
 *   reset   before choosing a new password                needs: a session (recovery link) and a verified phone
 *   change  verify a new number                           needs: a fully verified session (password + SMS)
 * On success: signup/change record the number on auth.users (Supabase owns phone_confirmed_at); every purpose records
 * an SMS step-up for this session. A challenge is single use, expires, and allows five attempts.
 */
export type SmsPurpose = 'signup' | 'login' | 'reset' | 'change';
export const SMS_TTL_MS = 10 * 60_000;
export const SMS_COOLDOWN_MS = 30_000;
export const SMS_MAX_SENDS = 5; // per user per 15 minutes
export const SMS_MAX_ATTEMPTS = 5;

export interface Challenge { id: string; user_id: string; session_id: string; purpose: SmsPurpose; phone: string; provider_session: string; attempts: number; created_at: string; expires_at: string; consumed_at: string | null }
export interface SmsStore {
  recentChallenges(userId: string, since: Date): Promise<{ created_at: string; session_id: string; consumed_at: string | null }[]>;
  createChallenge(row: Omit<Challenge, 'id' | 'attempts' | 'created_at' | 'consumed_at'>): Promise<{ id: string }>;
  getChallenge(id: string): Promise<Challenge | null>;
  /** Increments attempts and returns the new count. */
  bumpAttempts(id: string): Promise<number>;
  /** Marks consumed only if not yet consumed; true when this call consumed it (replay-safe). */
  consume(id: string): Promise<boolean>;
  phoneAvailable(phoneE164: string, userId: string): Promise<boolean>;
  /** Records the number as verified on auth.users. 'taken' when another account holds it. */
  confirmPhone(userId: string, phoneE164: string): Promise<'ok' | 'taken'>;
  recordStepUp(sessionId: string, userId: string): Promise<void>;
}
export type SmsErrorCode = 'NOT_SIGNED_IN' | 'NOT_ALLOWED' | 'INVALID_PHONE' | 'PHONE_TAKEN' | 'COOLDOWN' | 'TOO_MANY' | 'NOT_FOUND' | 'EXPIRED' | 'INVALID_CODE' | 'LOCKED' | 'PROVIDER';
export class SmsError extends Error { constructor(public code: SmsErrorCode, public retryAfter?: number) { super(code); } }
export interface Deps { store: SmsStore; sms: SmsOtpProvider; now?: () => Date }

export const maskPhone = (p: string) => (p.length > 6 ? `${p.slice(0, 3)} ••••• ${p.slice(-3)}` : '•••');
const digits = (p: string) => p.replace(/\D/g, '');

function phoneFor(s: ServerSession, purpose: SmsPurpose, requested?: string | null): string {
  switch (purpose) {
    case 'signup':
      if (!s.facts.passwordSession || !s.emailConfirmed || s.phoneConfirmed) throw new SmsError('NOT_ALLOWED');
      return requested ?? s.signupPhone ?? '';
    case 'login':
      if (!s.facts.passwordSession || !s.emailConfirmed || !s.phone) throw new SmsError('NOT_ALLOWED');
      return s.phone;
    case 'reset':
      if (!s.phone) throw new SmsError('NOT_ALLOWED');
      return s.phone;
    case 'change':
      if (s.gate !== 'ok' || !requested) throw new SmsError('NOT_ALLOWED');
      return requested;
  }
}

export async function startSms(s: ServerSession | null, purpose: SmsPurpose, requestedPhone: string | null | undefined, d: Deps) {
  if (!s) throw new SmsError('NOT_SIGNED_IN');
  const now = (d.now ?? (() => new Date()))();
  const raw = phoneFor(s, purpose, requestedPhone ? normalizePhone(requestedPhone) : null);
  const phone = normalizePhone(raw);
  if (!isPhone(phone)) throw new SmsError('INVALID_PHONE');
  if (purpose === 'change' && s.phone && digits(s.phone) === digits(phone)) throw new SmsError('INVALID_PHONE');
  if ((purpose === 'signup' || purpose === 'change') && !(await d.store.phoneAvailable(phone, s.userId))) throw new SmsError('PHONE_TAKEN');
  const recent = await d.store.recentChallenges(s.userId, new Date(now.getTime() - 15 * 60_000));
  // Resend cooldown per session while a code is pending (a used code does not hold up the next step); send cap per account.
  const last = recent.filter((r) => r.session_id === s.sessionId && !r.consumed_at).map((r) => new Date(r.created_at).getTime()).sort((a, b) => b - a)[0];
  if (last && now.getTime() - last < SMS_COOLDOWN_MS) throw new SmsError('COOLDOWN', Math.ceil((SMS_COOLDOWN_MS - (now.getTime() - last)) / 1000));
  if (recent.length >= SMS_MAX_SENDS) throw new SmsError('TOO_MANY', 15 * 60);
  let sessionId: string;
  try { ({ sessionId } = await d.sms.sendOtp(phone)); } catch { throw new SmsError('PROVIDER'); }
  const { id } = await d.store.createChallenge({ user_id: s.userId, session_id: s.sessionId, purpose, phone: digits(phone), provider_session: sessionId, expires_at: new Date(now.getTime() + SMS_TTL_MS).toISOString() });
  return { challengeId: id, phone: maskPhone(phone), purpose, cooldownSeconds: SMS_COOLDOWN_MS / 1000, expiresInSeconds: SMS_TTL_MS / 1000 };
}

export async function completeSms(s: ServerSession | null, challengeId: string, code: string, d: Deps): Promise<{ purpose: SmsPurpose; phone: string }> {
  if (!s) throw new SmsError('NOT_SIGNED_IN');
  const now = (d.now ?? (() => new Date()))();
  const c = await d.store.getChallenge(challengeId);
  // Another user's or another session's challenge looks exactly like a missing one.
  if (!c || c.user_id !== s.userId || c.session_id !== s.sessionId || c.consumed_at) throw new SmsError('NOT_FOUND');
  if (new Date(c.expires_at).getTime() <= now.getTime()) throw new SmsError('EXPIRED');
  if (c.attempts >= SMS_MAX_ATTEMPTS) throw new SmsError('LOCKED');
  if (!/^\d{4,8}$/.test(code)) throw new SmsError('INVALID_CODE');
  const attempts = await d.store.bumpAttempts(c.id);
  if (attempts > SMS_MAX_ATTEMPTS) throw new SmsError('LOCKED');
  let result: OtpCheck;
  try { result = await d.sms.verifyOtp(c.provider_session, code); } catch { throw new SmsError('PROVIDER'); }
  if (result === 'expired') throw new SmsError('EXPIRED');
  if (result !== 'matched') throw new SmsError(attempts >= SMS_MAX_ATTEMPTS ? 'LOCKED' : 'INVALID_CODE');
  if (!(await d.store.consume(c.id))) throw new SmsError('NOT_FOUND'); // replay of a code already used
  const phone = `+${c.phone}`;
  if (c.purpose === 'signup' || c.purpose === 'change') {
    if ((await d.store.confirmPhone(s.userId, phone)) === 'taken') throw new SmsError('PHONE_TAKEN');
  }
  await d.store.recordStepUp(s.sessionId, s.userId);
  return { purpose: c.purpose, phone };
}

/** Safe, user-facing messages. Never provider details. */
export const SMS_MESSAGES: Record<SmsErrorCode, string> = {
  NOT_SIGNED_IN: 'Sign in with your email and password first.',
  NOT_ALLOWED: 'This step is not available for your account right now. Sign in again.',
  INVALID_PHONE: 'Enter a different mobile number with its country code.',
  PHONE_TAKEN: 'That mobile number belongs to another account.',
  COOLDOWN: 'A code was just sent. Wait a moment before asking for another.',
  TOO_MANY: 'Too many codes requested. Try again in 15 minutes.',
  NOT_FOUND: 'That code is no longer valid. Send a new one.',
  EXPIRED: 'That code has expired. Send a new one.',
  INVALID_CODE: 'That code is not right. Check the SMS and try again.',
  LOCKED: 'Too many wrong codes. Send a new one.',
  PROVIDER: 'The SMS service is not responding. Try again in a moment.',
};
