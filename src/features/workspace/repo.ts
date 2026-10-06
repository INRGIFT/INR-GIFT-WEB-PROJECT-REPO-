'use client';
import { isSupabaseConfigured } from '@/lib/config';
import type { TableName, UserPrefs, WorkspaceTables } from '@/lib/types';
import { supabaseBrowser } from '@/supabase/client';

export type Row<T extends TableName> = WorkspaceTables[T];
export type NewRow<T extends TableName> = Omit<Row<T>, 'id' | 'created_at' | 'updated_at'>;
export const TABLES: TableName[] = ['watchlists', 'watchlist_items', 'alerts', 'saved_screens', 'saved_comparisons', 'saved_research', 'notes', 'recent_history', 'notifications', 'collections'];
export const DEFAULT_PREFS: UserPrefs = { currency: 'LOCAL', timezone: 'Asia/Kolkata', locale: 'en-IN', regions: [], assetClasses: [], themes: [], notifyEmail: true, notifyInApp: true };

/** Data access for the private workspace. The UI depends on this interface, not on Supabase. */
export interface WorkspaceRepo {
  loadAll(): Promise<{ [K in TableName]: Row<K>[] }>;
  insert<T extends TableName>(table: T, row: NewRow<T>): Promise<Row<T>>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<void>;
  remove(table: TableName, id: string): Promise<void>;
  getPrefs(): Promise<UserPrefs>;
  setPrefs(p: UserPrefs): Promise<void>;
}
type All = { [K in TableName]: Row<K>[] };
const empty = (): All => ({ watchlists: [], watchlist_items: [], alerts: [], saved_screens: [], saved_comparisons: [], saved_research: [], notes: [], recent_history: [], notifications: [], collections: [] });
const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/** Browser-local store used when Supabase is not configured. Same shapes as the SQL tables. */
export function localRepo(userId: string): WorkspaceRepo {
  const key = `inrgift.ws.${userId}`, prefKey = `inrgift.prefs.${userId}`;
  const read = (): All => {
    try { const raw = localStorage.getItem(key); if (raw) return { ...empty(), ...JSON.parse(raw) }; } catch { /* fall through to a fresh store */ }
    const now = new Date().toISOString();
    const fresh = empty();
    fresh.watchlists.push({ id: uid(), name: 'My watchlist', position: 0, created_at: now });
    fresh.notifications.push({ id: uid(), category: 'system', title: 'Welcome to INRGIFT', body: 'Add assets to your watchlist with the star on any table or asset page.', href: '/assets', read: false, created_at: now });
    localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  };
  const write = (all: All) => localStorage.setItem(key, JSON.stringify(all));
  return {
    async loadAll() { return read(); },
    async insert(table, row) { const all = read(); const now = new Date().toISOString(); const full = { ...row, id: uid(), created_at: now, ...(table === 'notes' ? { updated_at: now } : {}) } as unknown as Row<typeof table>; (all[table] as Row<typeof table>[]).unshift(full); write(all); return full; },
    async update(table, id, patch) { const all = read(); (all[table] as { id: string }[]) = (all[table] as { id: string }[]).map((r) => (r.id === id ? { ...r, ...patch } : r)); write(all); },
    async remove(table, id) { const all = read(); (all[table] as { id: string }[]) = (all[table] as { id: string }[]).filter((r) => r.id !== id); if (table === 'watchlists') all.watchlist_items = all.watchlist_items.filter((i) => i.watchlist_id !== id); write(all); },
    async getPrefs() { try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(prefKey) ?? '{}') }; } catch { return DEFAULT_PREFS; } },
    async setPrefs(p) { localStorage.setItem(prefKey, JSON.stringify(p)); },
  };
}

/** Supabase store. `user_id` is never sent: the column defaults to auth.uid() and RLS enforces ownership. */
export function supabaseRepo(): WorkspaceRepo {
  const sb = supabaseBrowser();
  const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };
  return {
    async loadAll() {
      const all = empty();
      await Promise.all(TABLES.map(async (t) => { const { data, error } = await sb.from(t).select('*').order('created_at', { ascending: false }).limit(500); fail(error); (all[t] as unknown[]) = data ?? []; }));
      return all;
    },
    async insert(table, row) { const { data, error } = await sb.from(table).insert(row as never).select().single(); fail(error); return data as Row<typeof table>; },
    async update(table, id, patch) { const { user_id: _ignored, ...safe } = patch as Record<string, unknown>; fail((await sb.from(table).update(safe).eq('id', id)).error); },
    async remove(table, id) { fail((await sb.from(table).delete().eq('id', id)).error); },
    async getPrefs() {
      const { data } = await sb.from('user_preferences').select('*').maybeSingle();
      return data ? { currency: data.currency, timezone: data.timezone, locale: data.locale, regions: data.regions, assetClasses: data.asset_classes, themes: data.themes, notifyEmail: data.notify_email, notifyInApp: data.notify_in_app } : DEFAULT_PREFS;
    },
    async setPrefs(p) {
      const { data } = await sb.auth.getUser();
      if (!data.user) return;
      fail((await sb.from('user_preferences').upsert({ user_id: data.user.id, currency: p.currency, timezone: p.timezone, locale: p.locale, regions: p.regions, asset_classes: p.assetClasses, themes: p.themes, notify_email: p.notifyEmail, notify_in_app: p.notifyInApp, updated_at: new Date().toISOString() })).error);
    },
  };
}
export const makeRepo = (userId: string): WorkspaceRepo => (isSupabaseConfigured ? supabaseRepo() : localRepo(userId));
