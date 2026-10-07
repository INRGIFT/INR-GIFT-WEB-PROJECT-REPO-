import type { SupabaseClient } from '@supabase/supabase-js';
import type { Challenge, SmsStore } from './sms-verification';

/** SmsStore on Supabase, using the secret-key client (RLS bypassed; these tables have no client write access). */
export function supabaseSmsStore(admin: SupabaseClient): SmsStore {
  const t = () => admin.from('sms_challenges');
  return {
    async recentChallenges(userId, since) {
      const { data, error } = await t().select('created_at, session_id, consumed_at').eq('user_id', userId).gte('created_at', since.toISOString());
      if (error) throw error;
      return data ?? [];
    },
    async createChallenge(row) {
      const { data, error } = await t().insert(row).select('id').single();
      if (error) throw error;
      return { id: data.id as string };
    },
    async getChallenge(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const { data, error } = await t().select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return (data as Challenge | null) ?? null;
    },
    async bumpAttempts(id) {
      const { data: cur, error: e1 } = await t().select('attempts').eq('id', id).single();
      if (e1) throw e1;
      const next = (cur.attempts as number) + 1;
      // Optimistic update on the value we read, so two parallel guesses cannot share one attempt.
      const { data, error } = await t().update({ attempts: next }).eq('id', id).eq('attempts', cur.attempts).select('attempts');
      if (error) throw error;
      return data?.length ? next : Number.MAX_SAFE_INTEGER;
    },
    async consume(id) {
      const { data, error } = await t().update({ consumed_at: new Date().toISOString() }).eq('id', id).is('consumed_at', null).select('id');
      if (error) throw error;
      return Boolean(data?.length);
    },
    async phoneAvailable(phone, userId) {
      // With the secret key there is no auth.uid(), so the account is passed explicitly (server-only function).
      const { data, error } = await admin.rpc('phone_available_for', { p_phone: phone, p_user: userId });
      if (error) throw error;
      return data === true;
    },
    async confirmPhone(userId, phone) {
      const { error } = await admin.auth.admin.updateUserById(userId, { phone, phone_confirm: true });
      if (!error) return 'ok';
      const m = `${error.message ?? ''} ${(error as { code?: string }).code ?? ''}`.toLowerCase();
      if (m.includes('already') || m.includes('exists') || m.includes('duplicate') || m.includes('in use') || m.includes('database error')) return 'taken';
      throw error;
    },
    async recordStepUp(sessionId, userId) {
      const { error } = await admin.from('sms_step_ups').upsert({ session_id: sessionId, user_id: userId, verified_at: new Date().toISOString() });
      if (error) throw error;
    },
  };
}
