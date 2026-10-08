import { json, ProviderError, request, statusCode, type Fetch } from '@/services/providers/http';
import { isoTime, safeMedia, safePermalink, shortText } from './social-normalize';
import type { SocialPost } from './social-types';

/**
 * Instagram API with Instagram Login (official; developers.facebook.com/docs/instagram-platform). Server only.
 *   GET https://graph.instagram.com/v21.0/{user-id|me}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username&limit=N
 *   Auth   access_token = INSTAGRAM_ACCESS_TOKEN (a long-lived token for the @inrgift professional account; renew it before
 *          its 60 days run out). The URL carries the token, so it is never logged: ProviderError holds no URL.
 * Only the fields above are read; no likes, comments or other engagement.
 */
const NAME = 'instagram';
export function instagram(opts: { accessToken: string; userId?: string; fetchImpl?: Fetch; timeoutMs?: number }) {
  if (!opts.accessToken) throw new ProviderError(NAME, 'NOT_CONFIGURED');
  return {
    async latest(limit: number, now = new Date()): Promise<SocialPost[]> {
      const u = new URL(`https://graph.instagram.com/v21.0/${encodeURIComponent(opts.userId || 'me')}/media`);
      u.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username');
      u.searchParams.set('limit', String(Math.min(10, Math.max(1, limit))));
      u.searchParams.set('access_token', opts.accessToken);
      const res = await request(NAME, u.toString(), { method: 'GET', headers: { Accept: 'application/json' }, fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 6000 });
      const code = statusCode(res.status);
      if (code) throw new ProviderError(NAME, code, res.status);
      return parseInstagram(await json(NAME, res), now);
    },
  };
}
export function parseInstagram(body: unknown, now = new Date()): SocialPost[] {
  const b = body as { data?: unknown } | null;
  if (!b || !Array.isArray(b.data)) throw new ProviderError(NAME, 'MALFORMED');
  return b.data.flatMap((raw): SocialPost[] => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const permalink = safePermalink('instagram', r.permalink);
    if (typeof r.id !== 'string' || !permalink) return [];
    const video = r.media_type === 'VIDEO';
    return [{
      id: r.id, platform: 'instagram', author: typeof r.username === 'string' ? r.username : null,
      published_at: isoTime(r.timestamp), text: shortText(r.caption),
      media: video ? safeMedia('instagram', r.thumbnail_url, 'video') : safeMedia('instagram', r.media_url, 'image'),
      permalink, fetched_at: now.toISOString(),
    }];
  });
}
