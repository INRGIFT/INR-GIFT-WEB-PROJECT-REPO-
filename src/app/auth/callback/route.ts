import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/config';
import { supabaseServer } from '@/supabase/server';

/** Landing point for email verification and password-reset links. Exchanges the code for a session cookie. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const nextParam = req.nextUrl.searchParams.get('next') ?? '/verify-phone';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/verify-phone';
  if (!isSupabaseConfigured || !code) return NextResponse.redirect(new URL('/login?error=link', req.url));
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? '/login?error=expired' : next, req.url));
}
