import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/config';
import { supabaseServer } from '@/supabase/server';

const TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

/**
 * Landing point for links in the INRGIFT email templates (supabase/templates). Verifies `token_hash` on the server,
 * so the link works even when opened on a different device or browser from the one that requested it — unlike
 * the PKCE `code` exchange in /auth/callback, which needs the verifier cookie from the original browser.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const tokenHash = q.get('token_hash');
  const type = q.get('type') as EmailOtpType | null;
  const nextParam = q.get('next') ?? '/verify-phone';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.startsWith('/\\') ? nextParam : '/verify-phone';
  if (!isSupabaseConfigured || !tokenHash || !type || !TYPES.includes(type)) return NextResponse.redirect(new URL('/login?error=link', req.url));
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  return NextResponse.redirect(new URL(error ? '/login?error=expired' : next, req.url));
}
