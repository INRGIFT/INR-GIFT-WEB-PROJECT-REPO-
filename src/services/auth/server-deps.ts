import { authMode } from '@/lib/config';
import { configured, serverEnv } from '@/lib/server-env';
import { twoFactor } from '@/services/providers/twofactor';
import { supabaseAdmin } from '@/supabase/admin';
import { supabaseSmsStore } from './sms-store';
import type { Deps } from './sms-verification';

/** SMS dependencies for route handlers, or null when Supabase (secret key) or 2Factor.in is not configured. */
export function smsDeps(): Deps | null {
  if (authMode !== 'supabase' || !configured.supabaseAdmin() || !configured.sms()) return null;
  return { store: supabaseSmsStore(supabaseAdmin()), sms: twoFactor({ apiKey: serverEnv.twoFactorApiKey(), template: serverEnv.twoFactorTemplate() || undefined }) };
}
