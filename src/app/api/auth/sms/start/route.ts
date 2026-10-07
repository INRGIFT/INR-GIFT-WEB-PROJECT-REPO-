import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { readServerSession } from '@/features/auth/server-facts';
import { rateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/telemetry/log';
import { smsDeps } from '@/services/auth/server-deps';
import { SMS_MESSAGES, SmsError, startSms } from '@/services/auth/sms-verification';
import { supabaseServer } from '@/supabase/server';

export const runtime = 'nodejs';
const Body = z.object({ purpose: z.enum(['signup', 'login', 'reset', 'change']), phone: z.string().max(32).optional() });

/** Sends an SMS code through 2Factor.in for the signed-in session. The browser never talks to 2Factor directly. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`sms-start:${ip}`, 10, 15 * 60_000).ok) return NextResponse.json({ error: { code: 'TOO_MANY', message: SMS_MESSAGES.TOO_MANY } }, { status: 429 });
  const deps = smsDeps();
  if (!deps) return NextResponse.json({ error: { code: 'NOT_CONFIGURED', message: 'SMS verification is not available yet.' } }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_QUERY', message: 'Check the request and try again.' } }, { status: 400 });
  try {
    const session = await readServerSession(await supabaseServer());
    const r = await startSms(session, parsed.data.purpose, parsed.data.phone, deps);
    return NextResponse.json({ data: r }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e instanceof SmsError) {
      if (e.code === 'PROVIDER') log('warn', 'sms_send_failed', { purpose: parsed.data.purpose });
      const status = e.code === 'NOT_SIGNED_IN' ? 401 : e.code === 'NOT_ALLOWED' ? 403 : e.code === 'COOLDOWN' || e.code === 'TOO_MANY' ? 429 : e.code === 'PROVIDER' ? 502 : 400;
      return NextResponse.json({ error: { code: e.code, message: SMS_MESSAGES[e.code], retryAfter: e.retryAfter } }, { status });
    }
    log('error', 'sms_send_error', { purpose: parsed.data.purpose });
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'That did not work. Try again in a moment.' } }, { status: 500 });
  }
}
