'use client';
import { EMAIL_RESEND_SECONDS, emailOtpSeconds } from '@/lib/config';

/**
 * When the current email verification code was sent, per address, for the countdowns on the "Verify your email" step.
 * A user-experience aid only: Supabase Auth decides whether a code is still valid (Email OTP Expiration = 120 s).
 *
 * Kept in localStorage so the countdown stays right after a refresh, back/forward, in another tab, or after the tab
 * was in the background (it is recomputed from the clock, never counted down in memory). The key is a hash of the
 * address, and the value is a time only: no code and no address is stored.
 */
const PREFIX = 'inrgift.otp.sent.';
const key = (email: string) => {
  let h = 2166136261;
  for (const c of email.trim().toLowerCase()) { h ^= c.codePointAt(0)!; h = Math.imul(h, 16777619); }
  return PREFIX + (h >>> 0).toString(36);
};
export function markCodeSent(email: string, at = Date.now()) { try { localStorage.setItem(key(email), String(at)); } catch { /* storage unavailable: countdown falls back to "unknown" */ } }
export function codeSentAt(email: string): number | null {
  try { const v = Number(localStorage.getItem(key(email))); return Number.isFinite(v) && v > 0 ? v : null; } catch { return null; }
}
export const isOtpStorageKey = (k: string | null) => Boolean(k?.startsWith(PREFIX));

export interface OtpClock { sentAt: number | null; secondsLeft: number | null; expired: boolean; resendIn: number }
/** The state of the code for `email` at `now`: seconds left (null when the send time is unknown) and the resend wait. */
export function otpClock(email: string, now = Date.now()): OtpClock {
  const sentAt = email ? codeSentAt(email) : null;
  if (!sentAt) return { sentAt: null, secondsLeft: null, expired: false, resendIn: 0 };
  const elapsed = Math.max(0, Math.floor((now - sentAt) / 1000));
  const secondsLeft = Math.max(0, emailOtpSeconds - elapsed);
  return { sentAt, secondsLeft, expired: secondsLeft === 0, resendIn: Math.max(0, EMAIL_RESEND_SECONDS - elapsed) };
}
/** "01:59" */
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
