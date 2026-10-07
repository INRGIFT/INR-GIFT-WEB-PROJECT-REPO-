import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { COUNTRIES } from '@/features/auth/countries';
import { isPhone, normalizePhone, passwordProblem } from '@/features/auth/policy';
import { readServerSession } from '@/features/auth/server-facts';
import { authMode } from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';
import { configured } from '@/lib/server-env';
import { log } from '@/lib/telemetry/log';
import { supabaseAdmin } from '@/supabase/admin';
import { supabaseServer } from '@/supabase/server';

export const runtime = 'nodejs';
const Body = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().max(32),
  country: z.enum(COUNTRIES),
  password: z.string().max(200).optional(),
  terms: z.boolean().optional(),
}).strict();
const fail = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Completes the profile of an account that signed in with Google (src/features/auth/policy.ts, profileMissing):
 * mobile number, a password, country and terms acceptance. Only the signed-in session's own account, only the fields
 * it lacks, and only after Google (or the password) opened the session. The password and the terms acceptance are
 * written with the server's secret key into app_metadata, which the person cannot edit, so the gate cannot be skipped
 * by changing user_metadata from the browser. Nothing here verifies the number: with the SMS second factor on, the
 * number is verified by an SMS code next.
 */
export async function POST(req: NextRequest) {
  if (authMode !== 'supabase' || !configured.supabaseAdmin()) return fail(503, 'NOT_CONFIGURED', 'Finishing a Google sign-in is not available right now. Sign in with your email and password, or email support@inrgift.com.');
  const sb = await supabaseServer();
  const session = await readServerSession(sb);
  if (!session) return fail(401, 'NOT_SIGNED_IN', 'Sign in again to finish your profile.');
  if (!rateLimit(`complete-profile:${session.userId}`, 10, 15 * 60_000).ok) return fail(429, 'TOO_MANY', 'Too many attempts. Try again later.');
  if (session.gate !== 'profile') return fail(409, 'INVALID_INPUT', 'Your profile is already complete.');
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(400, 'INVALID_INPUT', 'Check the form and try again.');
  const { name, country, password, terms } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  if (!isPhone(phone)) return fail(400, 'INVALID_INPUT', 'Enter the number with its country code, for example +91 98765 43210.');
  const needsPassword = session.missing.includes('password'), needsTerms = session.missing.includes('terms');
  if (needsPassword) { const p = password ? passwordProblem(password) : 'Enter a password.'; if (p) return fail(400, 'WEAK_PASSWORD', p); }
  if (needsTerms && terms !== true) return fail(400, 'INVALID_INPUT', 'Accept the Terms and Conditions and the Privacy Policy to continue.');
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin().auth.admin.updateUserById(session.userId, {
    ...(needsPassword ? { password } : {}),
    user_metadata: { full_name: name, phone, country },
    app_metadata: { inrgift: { password_set: needsPassword || session.profile.passwordSet || undefined, terms_accepted_at: needsTerms ? now : session.profile.termsAcceptedAt ?? undefined, profile_completed_at: now } },
  });
  if (error) {
    const weak = error.code === 'weak_password' || /password/i.test(error.message ?? '');
    return weak ? fail(400, 'WEAK_PASSWORD', 'Choose a stronger password.') : fail(500, 'UNKNOWN', 'Your profile could not be saved. Try again in a moment.');
  }
  log('info', 'security_profile_completed', { providers: session.profile.providers.join(','), passwordAdded: needsPassword });
  return NextResponse.json({ data: { completed: true } }, { headers: { 'Cache-Control': 'no-store' } });
}
