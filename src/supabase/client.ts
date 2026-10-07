'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured, supabaseCookieOptions } from '@/lib/config';

let client: SupabaseClient | null = null;
/** Browser client. Uses the publishable (or legacy anon) key only; all access is governed by row-level security. */
export function supabaseBrowser(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  client ??= createBrowserClient(config.supabaseUrl, config.supabaseKey, { cookieOptions: supabaseCookieOptions });
  return client;
}
