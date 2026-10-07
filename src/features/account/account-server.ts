import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServerSession } from '@/features/auth/server-facts';
import { configured } from '@/lib/server-env';
import { log } from '@/lib/telemetry/log';
import { supabaseAdmin } from '@/supabase/admin';
import type { AccountProfile } from './types';

/**
 * Server only. Reads the signed-in account's profile row (RLS: own row only) and builds the AccountProfile the account
 * pages show. The GIFT ID always comes from this lookup by the session's user id, never from anything a browser sent.
 *
 * Resilience: a missing profile row is created on the server (secret key; the database assigns the GIFT ID), so the
 * workspace never breaks on it. Before migration 0008 is applied the column does not exist and giftId is null.
 */
type Row = { gift_id?: string | null; full_name: string | null; country: string | null; created_at: string | null };
const MISSING_COLUMN = '42703';

async function readRow(sb: SupabaseClient, userId: string): Promise<{ row: Row | null; giftColumn: boolean }> {
  const withGift = await sb.from('profiles').select('gift_id, full_name, country, created_at').eq('user_id', userId).maybeSingle();
  if (!withGift.error) return { row: withGift.data as Row | null, giftColumn: true };
  if (withGift.error.code !== MISSING_COLUMN) throw new Error('profile read failed');
  const plain = await sb.from('profiles').select('full_name, country, created_at').eq('user_id', userId).maybeSingle();
  if (plain.error) throw new Error('profile read failed');
  return { row: plain.data as Row | null, giftColumn: false };
}

/** Creates the profile row when it is missing (never overwrites one). Returns false when that is not possible here. */
async function repairProfile(userId: string, name: string | null): Promise<boolean> {
  if (!configured.supabaseAdmin()) return false;
  const { error } = await supabaseAdmin().from('profiles').upsert({ user_id: userId, full_name: name }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) { log('warn', 'profile_repair_failed', { code: error.code ?? 'unknown' }); return false; }
  log('info', 'profile_repaired', {});
  return true;
}

/** The session's own GIFT ID (null before migration 0008, or if it cannot be read). */
export async function giftIdFor(sb: SupabaseClient, session: ServerSession): Promise<string | null> {
  try {
    let { row } = await readRow(sb, session.userId);
    if (!row && (await repairProfile(session.userId, session.account.name))) row = (await readRow(sb, session.userId)).row;
    return row?.gift_id ?? null;
  } catch { return null; }
}

export async function accountProfile(sb: SupabaseClient, session: ServerSession): Promise<AccountProfile> {
  let row: Row | null = null;
  try {
    row = (await readRow(sb, session.userId)).row;
    if (!row && (await repairProfile(session.userId, session.account.name))) row = (await readRow(sb, session.userId)).row;
  } catch { row = null; } // the auth record still describes the account; the profile row is optional for display
  const providers = session.profile.providers;
  return {
    giftId: row?.gift_id ?? null,
    name: row?.full_name || session.account.name || (session.email ? session.email.split('@')[0] : 'Account'),
    email: session.email,
    phone: session.phone ?? session.signupPhone,
    country: row?.country || session.account.country,
    emailVerified: session.emailConfirmed,
    phoneVerified: session.phoneConfirmed,
    providers,
    passwordSet: providers.includes('email') || session.profile.passwordSet,
    createdAt: session.account.createdAt ?? row?.created_at ?? null,
    lastSignInAt: session.account.lastSignInAt,
    session: session.session,
  };
}
