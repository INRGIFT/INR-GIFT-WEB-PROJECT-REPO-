import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

/** Cookie-bound server client for Server Components, Route Handlers and Server Actions. */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(config.supabaseUrl, config.supabaseKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a Server Component: middleware refreshes the session instead */ } },
    },
  });
}
