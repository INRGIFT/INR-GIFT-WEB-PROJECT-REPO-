/**
 * INRGIFT account policy. Pure functions shared by middleware (edge), route handlers, the auth forms and the tests.
 *
 * Every account has three credentials: email, mobile number and password. A session reaches the workspace only when
 * all of these are true, each read from Supabase on the server:
 *   1. it is signed in                                 (Supabase session)
 *   2. the email is confirmed                          (auth.users.email_confirmed_at)
 *   3. the session was opened with the password        (JWT amr contains "password")
 *   4. the mobile number is verified                   (auth.users.phone_confirmed_at, set by INRGIFT's server only
 *                                                       after 2Factor.in matched an SMS code)
 *   5. this session passed an SMS code                 (public.sms_step_ups row for the JWT session_id, server-written)
 * Never browser storage or app-owned "verified" flags. The database enforces the same rule with restrictive RLS
 * policies (supabase/migrations/0007_required_credentials_sms.sql).
 */

import { smsSecondFactor } from '@/lib/config';

export interface AuthFacts {
  signedIn: boolean;
  emailConfirmed: boolean;
  /** The account's mobile number is verified (Supabase auth.users.phone_confirmed_at). */
  phoneVerified: boolean;
  /** The session was opened with email + password (JWT amr), not a link or recovery. */
  passwordSession: boolean;
  /** This session passed an SMS code through 2Factor.in. */
  smsVerified: boolean;
}
export type Gate = 'ok' | 'login' | 'verify-email' | 'verify-phone' | 'sms';

/**
 * The next step a session must complete before the workspace opens; 'ok' when nothing is missing. Steps 4–5 apply only
 * when the SMS second factor is switched on (`smsSecondFactor`, src/lib/config.ts).
 */
export function workspaceGate(f: AuthFacts, sms: boolean = smsSecondFactor): Gate {
  if (!f.signedIn) return 'login';
  if (!f.emailConfirmed) return 'verify-email';
  if (!f.passwordSession) return 'login';
  if (!sms) return 'ok';
  if (!f.phoneVerified) return 'verify-phone';
  if (!f.smsVerified) return 'sms';
  return 'ok';
}
/** Phone verification (first time) and the per-sign-in SMS code both happen on /verify-phone. */
export const GATE_PATH: Record<Exclude<Gate, 'ok'>, string> = { login: '/login', 'verify-email': '/verify', 'verify-phone': '/verify-phone', sms: '/verify-phone' };

/** JWT `amr` arrives as [{ method, timestamp }] (Supabase) or as plain strings (RFC 8176). */
export function amrMethods(amr: unknown): string[] {
  if (!Array.isArray(amr)) return [];
  return amr.map((e) => (typeof e === 'string' ? e : e && typeof e === 'object' && 'method' in e ? String((e as { method: unknown }).method) : '')).filter(Boolean);
}

/* ---------------------------------- Field rules ---------------------------------- */
export function passwordProblem(pw: string): string | null {
  if (!pw) return 'Enter a password.';
  if (pw.length < 10) return 'Use at least 10 characters.';
  if (!/\d/.test(pw)) return 'Add at least one number.';
  if (!/[^\w\s]/.test(pw)) return 'Add at least one symbol.';
  return null;
}
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
/** E.164 after removing spaces, dashes and brackets: "+" then 8–15 digits, no leading zero. */
export const normalizePhone = (v: string) => v.replace(/[\s()-]/g, '');
export const isPhone = (v: string) => /^\+[1-9]\d{7,14}$/.test(normalizePhone(v));

export interface SignupInput { name: string; email: string; phone: string; password: string; confirm: string; terms: boolean }
export type SignupErrors = Partial<Record<keyof SignupInput, string>>;
/** Every field is required: email, phone and password are the account's three credentials. */
export function validateSignup(i: SignupInput): SignupErrors {
  const e: SignupErrors = {};
  if (!i.name.trim()) e.name = 'Enter your name.';
  if (!i.email.trim()) e.email = 'Enter your email address.';
  else if (!isEmail(i.email.trim())) e.email = 'Enter a valid email address.';
  if (!normalizePhone(i.phone).replace(/^\+\d{0,3}$/, '')) e.phone = 'Enter your mobile number.';
  else if (!isPhone(i.phone)) e.phone = 'Enter the number with its country code, for example +91 98765 43210.';
  const pw = passwordProblem(i.password);
  if (pw) e.password = pw;
  if (!i.confirm) e.confirm = 'Type the password again.';
  else if (i.confirm !== i.password) e.confirm = 'The two passwords do not match.';
  if (!i.terms) e.terms = 'Accept the terms to continue.';
  return e;
}
