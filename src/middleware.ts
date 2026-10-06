import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { config as app, DEMO_SESSION_COOKIE, isSupabaseConfigured } from '@/lib/config';

const PRIVATE = /^\/(app|account|notifications|onboarding)(\/|$)/;
/** Auth screens are public but never indexed. */
const NOINDEX = /^\/(login|signup|verify|verify-phone|mfa|forgot-password|reset-password)(\/|$)/;

/** Refreshes the Supabase session cookie on every request and guards private routes. */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  let authed = false;
  if (isSupabaseConfigured) {
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
    // getClaims() verifies the JWT (locally with asymmetric signing keys, otherwise against Auth).
    // Never trust getSession() on the server. Nothing may run between client creation and this call.
    const { data } = await supabase.auth.getClaims();
    authed = Boolean(data?.claims?.sub);
  } else {
    authed = req.cookies.get(DEMO_SESSION_COOKIE)?.value === '1';
  }
  if (PRIVATE.test(req.nextUrl.pathname)) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
      // Carry any cookies the refresh wrote (for example a cleared session) and their cache headers onto the redirect.
      const redirect = NextResponse.redirect(url);
      res.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      ['cache-control', 'expires', 'pragma'].forEach((h) => { const v = res.headers.get(h); if (v) redirect.headers.set(h, v); });
      return redirect;
    }
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'private, no-store');
  }
  if (NOINDEX.test(req.nextUrl.pathname)) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'] };
