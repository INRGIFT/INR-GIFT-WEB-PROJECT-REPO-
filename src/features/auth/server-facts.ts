import type { SupabaseClient } from '@supabase/supabase-js';
import { smsSecondFactor } from '@/lib/config';
import { amrMethods, isPrimarySignIn, profileFactsOf, profileMissing, workspaceGate, type AuthFacts, type Gate, type ProfileFacts, type ProfileField } from './policy';

/** Everything the server knows about the current request's session, read from Supabase only. */
export interface ServerSession {
  userId: string; sessionId: string; email: string | null; amr: string[];
  emailConfirmed: boolean; phoneConfirmed: boolean;
  /** Confirmed phone in E.164, if any. */
  phone: string | null;
  /** The number given at sign-up (not yet verified). */
  signupPhone: string | null;
  smsVerified: boolean;
  /** Identity providers, profile facts and what the profile still lacks (Google-only accounts). */
  profile: ProfileFacts; missing: ProfileField[];
  /** Account details for the account pages: real values from Supabase only, null when absent. */
  account: { name: string | null; country: string | null; createdAt: string | null; lastSignInAt: string | null };
  /** This session from its verified token: how it was opened, when, and when the current access token expires. */
  session: { method: 'password' | 'google' | 'other'; startedAt: string | null; tokenExpiresAt: string | null };
  facts: AuthFacts; gate: Gate;
}
const e164 = (p: string | null | undefined) => (p ? `+${p.replace(/\D/g, '')}` : null);

/**
 * Reads the verified JWT (getClaims), the user record (getUser) and this session's SMS step-up (RLS: own rows only).
 * Works in middleware (edge) and route handlers. Returns null when signed out.
 */
export async function readServerSession(sb: SupabaseClient): Promise<ServerSession | null> {
  const { data } = await sb.auth.getClaims();
  const claims = data?.claims as { sub?: string; session_id?: string; amr?: unknown; exp?: number } | undefined;
  if (!claims?.sub || !claims.session_id) return null;
  const { data: u } = await sb.auth.getUser();
  const user = u.user;
  if (!user || user.id !== claims.sub) return null;
  // The SMS step-up table exists from migration 0007; it is read only when the SMS second factor is on.
  const { data: step } = smsSecondFactor ? await sb.from('sms_step_ups').select('session_id').eq('session_id', claims.session_id).maybeSingle() : { data: null };
  const amr = amrMethods(claims.amr);
  const phoneConfirmed = Boolean(user.phone_confirmed_at && user.phone);
  const profile = profileFactsOf(user);
  const missing = profileMissing(profile);
  const facts: AuthFacts = { signedIn: true, emailConfirmed: Boolean(user.email_confirmed_at), phoneVerified: phoneConfirmed, primarySignIn: isPrimarySignIn(amr), profileComplete: missing.length === 0, smsVerified: Boolean(step) };
  // amr arrives as [{ method, timestamp }]; the latest password/OAuth entry is when this session was opened.
  const opened = Array.isArray(claims.amr) ? (claims.amr as { method?: string; timestamp?: number }[]).filter((e) => e && (e.method === 'password' || e.method === 'oauth') && typeof e.timestamp === 'number').sort((a, b) => b.timestamp! - a.timestamp!)[0] : undefined;
  const iso = (secs: number | undefined) => (typeof secs === 'number' && secs > 0 ? new Date(secs * 1000).toISOString() : null);
  const meta = (user.user_metadata ?? {}) as { full_name?: unknown; name?: unknown; country?: unknown };
  return {
    userId: user.id, sessionId: claims.session_id, email: user.email ?? null, amr,
    account: {
      name: typeof meta.full_name === 'string' && meta.full_name ? meta.full_name : typeof meta.name === 'string' && meta.name ? meta.name : null,
      country: typeof meta.country === 'string' && meta.country ? meta.country : null,
      createdAt: user.created_at ?? null, lastSignInAt: user.last_sign_in_at ?? null,
    },
    session: { method: amr.includes('password') ? 'password' : amr.includes('oauth') ? 'google' : 'other', startedAt: iso(opened?.timestamp), tokenExpiresAt: iso(claims.exp) },
    emailConfirmed: facts.emailConfirmed, phoneConfirmed, phone: phoneConfirmed ? e164(user.phone) : null,
    signupPhone: e164(user.user_metadata?.phone as string | undefined), smsVerified: facts.smsVerified, profile, missing, facts, gate: workspaceGate(facts),
  };
}
