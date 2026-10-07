import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { serverEnv } from '@/lib/server-env';

/**
 * Secret-key Supabase client for INRGIFT's server only (route handlers). It bypasses RLS, so it is used for exactly
 * two things: recording a phone as verified on auth.users after 2Factor.in matched the code, and writing SMS
 * challenges and per-session step-ups. Never import this from client code or middleware.
 */
export function supabaseAdmin() {
  if (typeof window !== 'undefined') throw new Error('supabaseAdmin is server-only');
  const key = serverEnv.supabaseSecretKey();
  if (!config.supabaseUrl || !key) throw new Error('Supabase secret key is not configured');
  return createClient(config.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
