import type { SupabaseClient } from '@supabase/supabase-js';
import { amrMethods, workspaceGate, type AuthFacts, type Gate } from './policy';

/** Everything the server knows about the current request's session, read from Supabase only. */
export interface ServerSession {
  userId: string; sessionId: string; email: string | null; amr: string[];
  emailConfirmed: boolean; phoneConfirmed: boolean;
  /** Confirmed phone in E.164, if any. */
  phone: string | null;
  /** The number given at sign-up (not yet verified). */
  signupPhone: string | null;
  smsVerified: boolean;
  facts: AuthFacts; gate: Gate;
}
const e164 = (p: string | null | undefined) => (p ? `+${p.replace(/\D/g, '')}` : null);

/**
 * Reads the verified JWT (getClaims), the user record (getUser) and this session's SMS step-up (RLS: own rows only).
 * Works in middleware (edge) and route handlers. Returns null when signed out.
 */
export async function readServerSession(sb: SupabaseClient): Promise<ServerSession | null> {
  const { data } = await sb.auth.getClaims();
  const claims = data?.claims as { sub?: string; session_id?: string; amr?: unknown } | undefined;
  if (!claims?.sub || !claims.session_id) return null;
  const { data: u } = await sb.auth.getUser();
  const user = u.user;
  if (!user || user.id !== claims.sub) return null;
  const { data: step } = await sb.from('sms_step_ups').select('session_id').eq('session_id', claims.session_id).maybeSingle();
  const amr = amrMethods(claims.amr);
  const phoneConfirmed = Boolean(user.phone_confirmed_at && user.phone);
  const facts: AuthFacts = { signedIn: true, emailConfirmed: Boolean(user.email_confirmed_at), phoneVerified: phoneConfirmed, passwordSession: amr.includes('password'), smsVerified: Boolean(step) };
  return {
    userId: user.id, sessionId: claims.session_id, email: user.email ?? null, amr,
    emailConfirmed: facts.emailConfirmed, phoneConfirmed, phone: phoneConfirmed ? e164(user.phone) : null,
    signupPhone: e164(user.user_metadata?.phone as string | undefined), smsVerified: facts.smsVerified, facts, gate: workspaceGate(facts),
  };
}
