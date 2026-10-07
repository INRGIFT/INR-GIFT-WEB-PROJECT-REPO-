import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { GATE_PATH, type Gate } from '@/features/auth/policy';
import { readServerSession } from '@/features/auth/server-facts';
import { authMode, config as app, DEMO_SESSION_COOKIE } from '@/lib/config';
import { classifyPath, isNoindexPath } from '@/lib/route-registry';
import { safeReturnPath } from '@/lib/return-url';

/**
 * The site's access gate (src/lib/route-registry.ts): only "/" and the listed public pages are open; every other page
 * and API needs a fully verified session (src/features/auth/policy.ts: password session, confirmed email, verified
 * phone, SMS code in this session). Pages redirect to the missing step with ?next=<path+query>; APIs answer 401/403
 * JSON. Protected responses are private and uncacheable, and everything except the public pages is noindex.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const { pathname, search } = req.nextUrl;
  const access = classifyPath(pathname);
  if (access === 'file') return res;
  let gate: Gate = 'login';
  if (authMode === 'supabase') {
    const supabase = createServerClient(app.supabaseUrl, app.supabaseKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[], headers?: Record<string, string>) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
          // Cache-Control / Expires / Pragma that stop a CDN from caching a response carrying a refreshed session.
          Object.entries(headers ?? {}).forEach(([k, v]) => res.headers.set(k, v));
        },
      },
    });
    // getClaims() verifies the JWT (locally with asymmetric signing keys, otherwise against Auth); it is the first call
    // after creating the client. Protected paths also read the user record and this session's SMS step-up.
    if (access === 'protected') gate = (await readServerSession(supabase))?.gate ?? 'login';
    else await supabase.auth.getClaims();
  } else if (authMode === 'demo') {
    // Development and test builds only (src/lib/config.ts). The demo sets this cookie only when the same gate passes.
    gate = req.cookies.get(DEMO_SESSION_COOKIE)?.value === '1' ? 'ok' : 'login';
  }
  const carry = (out: NextResponse) => {
    // Cookies the refresh wrote (for example a cleared session) and their cache headers travel with a redirect too.
    res.cookies.getAll().forEach((c) => out.cookies.set(c));
    ['cache-control', 'expires', 'pragma'].forEach((h) => { const v = res.headers.get(h); if (v) out.headers.set(h, v); });
    return out;
  };
  if (access === 'protected') {
    if (gate !== 'ok') {
      if (pathname.startsWith('/api/')) {
        const code = gate === 'login' ? 'UNAUTHENTICATED' : 'VERIFICATION_REQUIRED';
        return carry(NextResponse.json({ error: { code, step: gate, message: gate === 'login' ? 'Sign in to use INRGIFT.' : 'Finish verifying your account to use INRGIFT.' } }, { status: gate === 'login' ? 401 : 403, headers: { 'Cache-Control': 'no-store' } }));
      }
      const url = req.nextUrl.clone();
      url.pathname = GATE_PATH[gate];
      url.search = `?next=${encodeURIComponent(safeReturnPath(`${pathname}${search}`))}`;
      return carry(NextResponse.redirect(url));
    }
    res.headers.set('Cache-Control', 'private, no-store');
  }
  if (isNoindexPath(pathname) || search) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
// Everything except Next's own static assets; public files are classified (and let through) above.
export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
