import { EMAIL_OTP_LENGTH } from '@/lib/config';

/**
 * The length of the last email code Supabase handed to the Send Email Hook in this server process: the digit count
 * only, never the code. /api/health reports it, so a Supabase "Email OTP Length" that differs from INRGIFT's six is
 * visible without reading logs. Resets when the server restarts (null = no code seen since then).
 */
let lastSeen: { length: number; at: string } | null = null;
export function recordOtpLength(length: number, now = new Date()) { lastSeen = { length, at: now.toISOString() }; }
export function otpLengthStatus(): { expectedLength: number; lastSeenLength: number | null; lastSeenAt: string | null; status: 'ok' | 'mismatch' | 'unknown' } {
  if (!lastSeen) return { expectedLength: EMAIL_OTP_LENGTH, lastSeenLength: null, lastSeenAt: null, status: 'unknown' };
  return { expectedLength: EMAIL_OTP_LENGTH, lastSeenLength: lastSeen.length, lastSeenAt: lastSeen.at, status: lastSeen.length === EMAIL_OTP_LENGTH ? 'ok' : 'mismatch' };
}
export const resetOtpLength = () => { lastSeen = null; };
