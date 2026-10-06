import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { config as app, DEMO_SESSION_COOKIE, isSupabaseConfigured } from '@/lib/config';

const PRIVATE = /^\/(app|account|notifications|onboarding)(\/|$)/;

/** Refreshes the Supabase session cookie on every request and guards private routes. */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  let authed = false;
  if (isSupabaseConfigured) {
    const supabase = createServerClient(app.supabaseUrl, app.supabaseAnonKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => { res = NextResponse.next({ request: req }); list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
      },
    });
    // getUser() validates the token with Supabase; never trust getSession() alone on the server.
    authed = Boolean((await supabase.auth.getUser()).data.user);
  } else {
    authed = req.cookies.get(DEMO_SESSION_COOKIE)?.value === '1';
  }
  if (PRIVATE.test(req.nextUrl.pathname)) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
      return NextResponse.redirect(url);
    }
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'private, no-store');
  }
  return res;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'] };
