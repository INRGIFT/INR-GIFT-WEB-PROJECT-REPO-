import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { readServerSession } from '@/features/auth/server-facts';
import { rateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/telemetry/log';
import { sendEmail } from '@/services/email/email-service';
import { emailTemplates } from '@/services/email/templates';
import { smsDeps } from '@/services/auth/server-deps';
import { completeSms, maskPhone, SMS_MESSAGES, SmsError } from '@/services/auth/sms-verification';
import { supabaseServer } from '@/supabase/server';

export const runtime = 'nodejs';
const Body = z.object({ challengeId: z.string().uuid(), code: z.string().regex(/^\d{4,8}$/) });

/**
 * Checks an SMS code with 2Factor.in. Only on "OTP Matched" does the server record the verified number (auth.users,
 * via Supabase) and this session's SMS step-up. The challenge must belong to this user AND this session.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`sms-verify:${ip}`, 30, 15 * 60_000).ok) return NextResponse.json({ error: { code: 'TOO_MANY', message: SMS_MESSAGES.LOCKED } }, { status: 429 });
  const deps = smsDeps();
  if (!deps) return NextResponse.json({ error: { code: 'NOT_CONFIGURED', message: 'SMS verification is not available yet.' } }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_CODE', message: SMS_MESSAGES.INVALID_CODE } }, { status: 400 });
  try {
    const sb = await supabaseServer();
    const session = await readServerSession(sb);
    const r = await completeSms(session, parsed.data.challengeId, parsed.data.code, deps);
    if (r.purpose === 'change' && session?.email) await sendEmail(session.email, emailTemplates.phoneChanged(maskPhone(r.phone)), 'phone_changed');
    log('info', 'sms_verified', { purpose: r.purpose });
    return NextResponse.json({ data: { purpose: r.purpose } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e instanceof SmsError) {
      const status = e.code === 'NOT_SIGNED_IN' ? 401 : e.code === 'PROVIDER' ? 502 : e.code === 'LOCKED' ? 429 : 400;
      return NextResponse.json({ error: { code: e.code, message: SMS_MESSAGES[e.code] } }, { status });
    }
    log('error', 'sms_verify_error', {});
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'That did not work. Try again in a moment.' } }, { status: 500 });
  }
}
