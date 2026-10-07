import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { isPhone, normalizePhone } from '@/features/auth/policy';
import { isSupabaseConfigured } from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';
import { supabaseServer } from '@/supabase/server';

const Body = z.object({ phone: z.string().max(32) });

/**
 * Whether a mobile number is free for this visitor (sign-up, or a signed-in number change). Answers only true or
 * false and is rate-limited per connection to slow enumeration. The authority is the database: a unique constraint
 * on public.account_phones, checked again by triggers when the account is created and when a phone factor is
 * enrolled or verified (supabase/migrations/0007_require_phone_mfa.sql).
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`phone-available:${ip}`, 10, 10 * 60_000).ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Wait a few minutes, then try again.' } }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : '';
  if (!isPhone(phone)) return NextResponse.json({ error: { code: 'INVALID_QUERY', message: 'Enter the number with its country code.' } }, { status: 400 });
  if (!isSupabaseConfigured) return NextResponse.json({ error: { code: 'NOT_CONFIGURED', message: 'Sign-in is not configured in this environment.' } }, { status: 503 });
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc('phone_available', { p_phone: phone });
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'That did not work. Try again in a moment.' } }, { status: 500 });
  return NextResponse.json({ available: data === true });
}
