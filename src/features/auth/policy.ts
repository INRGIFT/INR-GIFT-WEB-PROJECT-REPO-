/**
 * INRGIFT account policy. Pure functions shared by middleware (edge), route handlers, the auth forms and the tests.
 *
 * Every account has three credentials: email, mobile number and password. Google is an additional way to sign in, not a
 * replacement: a Google account completes the same profile (mobile number, password, country, terms) before use.
 * A session reaches the workspace only when all of these are true, each read from Supabase on the server:
 *   1. it is signed in                                 (Supabase session)
 *   2. the email is confirmed                          (auth.users.email_confirmed_at; Google emails arrive confirmed)
 *   3. the session was opened with the password or Google (JWT amr contains "password" or "oauth"; never a link,
 *                                                       recovery or magic link)
 *   4. the profile is complete                         (mobile number; a password: an email identity or the
 *                                                       server-written app_metadata.inrgift.password_set; for
 *                                                       Google-only accounts also country and terms acceptance)
 *   5. the mobile number is verified                   (auth.users.phone_confirmed_at, set by INRGIFT's server only
 *                                                       after 2Factor.in matched an SMS code)
 *   6. this session passed an SMS code                 (public.sms_step_ups row for the JWT session_id, server-written)
 * Steps 5–6 apply only while the SMS second factor is switched on.
 * Never browser storage or app-owned "verified" flags. The database enforces the same rule with restrictive RLS
 * policies (supabase/migrations/0007_required_credentials_sms.sql).
 */

import { smsSecondFactor } from '@/lib/config';

export interface AuthFacts {
  signedIn: boolean;
  emailConfirmed: boolean;
  /** The account's mobile number is verified (Supabase auth.users.phone_confirmed_at). */
  phoneVerified: boolean;
  /** The session was opened with email + password or with Google (JWT amr), not a link or recovery. */
  primarySignIn: boolean;
  /** Mobile number, password and (for Google-only accounts) country and terms are on file (`profileMissing`). */
  profileComplete: boolean;
  /** This session passed an SMS code through 2Factor.in. */
  smsVerified: boolean;
}
export type Gate = 'ok' | 'login' | 'verify-email' | 'profile' | 'verify-phone' | 'sms';

/**
 * The next step a session must complete before the workspace opens; 'ok' when nothing is missing. The SMS steps apply
 * only when the SMS second factor is switched on (`smsSecondFactor`, src/lib/config.ts).
 */
export function workspaceGate(f: AuthFacts, sms: boolean = smsSecondFactor): Gate {
  if (!f.signedIn) return 'login';
  if (!f.emailConfirmed) return 'verify-email';
  if (!f.primarySignIn) return 'login';
  if (!f.profileComplete) return 'profile';
  if (!sms) return 'ok';
  if (!f.phoneVerified) return 'verify-phone';
  if (!f.smsVerified) return 'sms';
  return 'ok';
}
/** Phone verification (first time) and the per-sign-in SMS code both happen on /verify-phone. */
export const GATE_PATH: Record<Exclude<Gate, 'ok'>, string> = { login: '/login', 'verify-email': '/verify', profile: '/complete-profile', 'verify-phone': '/verify-phone', sms: '/verify-phone' };
/** Sign-in methods that open a session: the password and Google (Supabase reports OAuth as "oauth"). */
export const isPrimarySignIn = (amr: string[]) => amr.includes('password') || amr.includes('oauth');

export type ProfileField = 'phone' | 'password' | 'country' | 'terms';
export interface ProfileFacts {
  /** Identity providers on the account ("email" = signed up with email + password, "google"). */
  providers: string[];
  /** Mobile number on file (verified or as given), E.164. */
  phone: string | null;
  country: string | null;
  /** Server-written (app_metadata.inrgift): a password was set through INRGIFT, and when the terms were accepted. */
  passwordSet: boolean;
  termsAcceptedAt: string | null;
}
/**
 * What an account still has to give before it can be used. Accounts created with email + password gave everything at
 * sign-up (the form requires phone, country and terms), so only an older account without a number lacks something.
 * Google-only accounts give the number, a password, country and terms on /complete-profile.
 */
export function profileMissing(p: ProfileFacts): ProfileField[] {
  const emailAccount = p.providers.includes('email');
  const missing: ProfileField[] = [];
  if (!p.phone || !isPhone(p.phone)) missing.push('phone');
  if (!emailAccount && !p.passwordSet) missing.push('password');
  if (!emailAccount && !p.country) missing.push('country');
  if (!emailAccount && !p.termsAcceptedAt) missing.push('terms');
  return missing;
}
/** Reads ProfileFacts from a Supabase user record (user_metadata is the person's; app_metadata only the server's). */
export function profileFactsOf(u: { identities?: { provider: string }[] | null; app_metadata?: Record<string, unknown> | null; user_metadata?: Record<string, unknown> | null; phone?: string | null; phone_confirmed_at?: string | null }): ProfileFacts {
  const app = (u.app_metadata ?? {}) as { providers?: unknown; inrgift?: { password_set?: unknown; terms_accepted_at?: unknown } };
  const meta = (u.user_metadata ?? {}) as { phone?: unknown; country?: unknown };
  const providers = new Set<string>([...(u.identities ?? []).map((i) => i.provider), ...(Array.isArray(app.providers) ? app.providers.map(String) : [])]);
  const verified = u.phone_confirmed_at && u.phone ? `+${u.phone.replace(/\D/g, '')}` : null;
  return {
    providers: [...providers],
    phone: verified ?? (typeof meta.phone === 'string' ? normalizePhone(meta.phone) : null),
    country: typeof meta.country === 'string' && meta.country ? meta.country : null,
    passwordSet: app.inrgift?.password_set === true,
    termsAcceptedAt: typeof app.inrgift?.terms_accepted_at === 'string' ? app.inrgift.terms_accepted_at : null,
  };
}

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
