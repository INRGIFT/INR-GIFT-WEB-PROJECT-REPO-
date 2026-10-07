import { authMode, smsSecondFactor } from '@/lib/config';
import { configured, serverEnv } from '@/lib/server-env';
import { twoFactor } from '@/services/providers/twofactor';
import { supabaseAdmin } from '@/supabase/admin';
import { supabaseSmsStore } from './sms-store';
import type { Deps } from './sms-verification';

/** SMS dependencies for route handlers, or null when Supabase (secret key) or 2Factor.in is not configured. */
export function smsDeps(): Deps | null {
  // Never active until the SMS second factor is switched on (DLT approval + migration 0007), even if keys are present.
  if (!smsSecondFactor || authMode !== 'supabase' || !configured.supabaseAdmin() || !configured.sms()) return null;
  return { store: supabaseSmsStore(supabaseAdmin()), sms: twoFactor({ apiKey: serverEnv.twoFactorApiKey(), template: serverEnv.twoFactorTemplate() || undefined }) };
}
