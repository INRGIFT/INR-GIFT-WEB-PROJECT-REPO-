import { NextResponse, type NextRequest } from 'next/server';
import { landing } from '@/lib/auth-links';
import { isSupabaseConfigured, redirectBase } from '@/lib/config';
import { safeReturnPath } from '@/lib/return-url';
import { supabaseServer } from '@/supabase/server';

/**
 * PKCE landing point for Supabase redirects:
 *   flow=signup    email verification link   → session closed, sign in with the password next
 *   flow=recovery  password-reset link       → /reset-password
 *   flow=oauth     Continue with Google      → the destination; middleware then sends an incomplete Google account
 *                                              to /complete-profile (and, with SMS on, to the SMS step)
 * A provider error (cancelled consent, provider disabled) or a bad/expired code lands on /login with a message.
 * `next` is only ever an internal path (safeReturnPath).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const flow = q.get('flow');
  const next = safeReturnPath(q.get('next'), '');
  const go = (path: string) => NextResponse.redirect(new URL(path, redirectBase(req.url)));
  const withNext = (path: string) => `${path}${next ? `${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}` : ''}`;
  if (flow === 'oauth' && (q.get('error') || q.get('error_code'))) return go(withNext('/login?error=oauth'));
  const code = q.get('code');
  if (!isSupabaseConfigured || !code) return go(flow === 'oauth' ? withNext('/login?error=oauth') : '/login?error=link');
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return go(flow === 'oauth' ? withNext('/login?error=oauth') : '/login?error=expired');
  if (flow === 'oauth') return go(next || '/app');
  const kind = flow === 'recovery' ? 'recovery' : 'signup';
  if (kind === 'signup') await supabase.auth.signOut({ scope: 'local' });
  return go(landing(kind, next));
}
