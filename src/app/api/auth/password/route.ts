import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { passwordProblem } from '@/features/auth/policy';
import { readServerSession } from '@/features/auth/server-facts';
import { authMode } from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/services/email/email-service';
import { emailTemplates } from '@/services/email/templates';
import { supabaseServer } from '@/supabase/server';

export const runtime = 'nodejs';
const Body = z.object({ password: z.string().max(200) });

/**
 * Changes the password for the signed-in session (security page, or the recovery session from a reset link).
 * When the account has a verified phone, this session must have passed an SMS code first, so a reset link alone can
 * never change the password; SMS verification itself is never turned off by a reset. Other sessions are signed out.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`password:${ip}`, 10, 15 * 60_000).ok) return NextResponse.json({ error: { code: 'TOO_MANY', message: 'Too many attempts. Try again later.' } }, { status: 429 });
  if (authMode !== 'supabase') return NextResponse.json({ error: { code: 'NOT_CONFIGURED', message: 'Sign-in is not available yet.' } }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const problem = parsed.success ? passwordProblem(parsed.data.password) : 'Enter a password.';
  if (!parsed.success || problem) return NextResponse.json({ error: { code: 'WEAK_PASSWORD', message: problem } }, { status: 400 });
  const sb = await supabaseServer();
  const session = await readServerSession(sb);
  if (!session) return NextResponse.json({ error: { code: 'NOT_SIGNED_IN', message: 'Sign in first.' } }, { status: 401 });
  if (session.phoneConfirmed && !session.smsVerified) return NextResponse.json({ error: { code: 'SMS_REQUIRED', message: 'Confirm the code sent to your phone first.' } }, { status: 403 });
  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) return NextResponse.json({ error: { code: 'REJECTED', message: error.code === 'same_password' ? 'Choose a password you have not used here before.' : 'Choose a stronger password.' } }, { status: 400 });
  await sb.auth.signOut({ scope: 'others' });
  if (session.email) await sendEmail(session.email, emailTemplates.passwordChanged(), 'password_changed');
  return NextResponse.json({ data: { changed: true } });
}
