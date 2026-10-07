import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { landing, linkKind } from '@/lib/auth-links';
import { isSupabaseConfigured } from '@/lib/config';
import { supabaseServer } from '@/supabase/server';

/**
 * Landing point for links in the INRGIFT email templates (supabase/templates). Verifies `token_hash` on the server,
 * so the link works even when opened on a different device or browser from the one that requested it — unlike
 * the PKCE `code` exchange in /auth/callback, which needs the verifier cookie from the original browser.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const tokenHash = q.get('token_hash');
  const type = q.get('type') as EmailOtpType | null;
  const kind = linkKind(type);
  if (!isSupabaseConfigured || !tokenHash || !type || !kind) return NextResponse.redirect(new URL('/login?error=link', req.url));
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return NextResponse.redirect(new URL('/login?error=expired', req.url));
  // A confirmation link verifies the email only; the person signs in with the password next.
  if (kind === 'signup') await supabase.auth.signOut({ scope: 'local' });
  return NextResponse.redirect(new URL(landing(kind, req.nextUrl.searchParams.get('next')), req.url));
}
