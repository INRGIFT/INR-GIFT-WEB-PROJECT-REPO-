import { json, ProviderError, request, statusCode, type Fetch } from '@/services/providers/http';
import { isoTime, safeMedia, safePermalink, shortText } from './social-normalize';
import type { SocialPost } from './social-types';

/**
 * X API v2 (official; docs.x.com/x-api). Server only, app-only Bearer token (X_BEARER_TOKEN). Reading a user's posts
 * needs an X API plan that includes the user-timeline endpoint.
 *   GET https://api.x.com/2/users/by/username/INRGIFT                → the account id (or set X_USER_ID)
 *   GET https://api.x.com/2/users/{id}/tweets?max_results=5&exclude=retweets,replies
 *       &tweet.fields=created_at,attachments&expansions=attachments.media_keys,author_id&user.fields=username
 *       &media.fields=type,url,preview_image_url
 * Only text, time, author handle and the first image are read; no likes, views or replies. Permalinks are built on
 * x.com from the post id the API returned.
 */
const NAME = 'x';
export const X_HANDLE = 'INRGIFT';
export function xApi(opts: { bearerToken: string; userId?: string; fetchImpl?: Fetch; timeoutMs?: number }) {
  if (!opts.bearerToken) throw new ProviderError(NAME, 'NOT_CONFIGURED');
  const get = async (url: string) => {
    const res = await request(NAME, url, { method: 'GET', headers: { Authorization: `Bearer ${opts.bearerToken}`, Accept: 'application/json' }, fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 6000 });
    const code = statusCode(res.status);
    if (code) throw new ProviderError(NAME, code, res.status);
    return json(NAME, res);
  };
  let userId = opts.userId && /^\d{1,25}$/.test(opts.userId) ? opts.userId : null;
  return {
    async latest(limit: number, now = new Date()): Promise<SocialPost[]> {
      if (!userId) {
        const u = (await get(`https://api.x.com/2/users/by/username/${X_HANDLE}`)) as { data?: { id?: unknown } } | null;
        if (typeof u?.data?.id !== 'string' || !/^\d{1,25}$/.test(u.data.id)) throw new ProviderError(NAME, 'MALFORMED');
        userId = u.data.id;
      }
      const q = new URL(`https://api.x.com/2/users/${userId}/tweets`);
      q.searchParams.set('max_results', String(Math.min(100, Math.max(5, limit))));
      q.searchParams.set('exclude', 'retweets,replies');
      q.searchParams.set('tweet.fields', 'created_at,attachments');
      q.searchParams.set('expansions', 'attachments.media_keys,author_id');
      q.searchParams.set('user.fields', 'username');
      q.searchParams.set('media.fields', 'type,url,preview_image_url');
      return parseX(await get(q.toString()), now);
    },
  };
}
export function parseX(body: unknown, now = new Date()): SocialPost[] {
  const b = body as { data?: unknown; includes?: { media?: unknown; users?: unknown }; meta?: { result_count?: unknown } } | null;
  if (!b || typeof b !== 'object') throw new ProviderError(NAME, 'MALFORMED');
  if (b.data === undefined && b.meta?.result_count === 0) return [];
  if (!Array.isArray(b.data)) throw new ProviderError(NAME, 'MALFORMED');
  const media = new Map<string, Record<string, unknown>>();
  if (Array.isArray(b.includes?.media)) for (const m of b.includes!.media as Record<string, unknown>[]) if (typeof m?.media_key === 'string') media.set(m.media_key, m);
  const users = new Map<string, string>();
  if (Array.isArray(b.includes?.users)) for (const u of b.includes!.users as Record<string, unknown>[]) if (typeof u?.id === 'string' && typeof u.username === 'string') users.set(u.id, u.username);
  return b.data.flatMap((raw): SocialPost[] => {
    const r = (raw ?? {}) as Record<string, unknown>;
    if (typeof r.id !== 'string' || !/^\d{1,25}$/.test(r.id)) return [];
    const permalink = safePermalink('x', `https://x.com/${X_HANDLE}/status/${r.id}`)!;
    const keys = ((r.attachments as { media_keys?: unknown } | undefined)?.media_keys);
    const first = Array.isArray(keys) && typeof keys[0] === 'string' ? media.get(keys[0]) : undefined;
    const m = first ? (first.type === 'photo' ? safeMedia('x', first.url, 'image') : safeMedia('x', first.preview_image_url, 'video')) : null;
    const author = typeof r.author_id === 'string' ? users.get(r.author_id) ?? null : null;
    return [{ id: r.id, platform: 'x', author, published_at: isoTime(r.created_at), text: shortText(r.text), media: m, permalink, fetched_at: now.toISOString() }];
  });
}
