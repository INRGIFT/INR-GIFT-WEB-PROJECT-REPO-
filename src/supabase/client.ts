'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from '@/lib/config';

let client: SupabaseClient | null = null;
/** Browser client. Uses the anon key only; all access is governed by row-level security. */
export function supabaseBrowser(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  client ??= createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
  return client;
}
