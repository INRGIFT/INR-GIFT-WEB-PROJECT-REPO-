import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeSocial } from '@/features/home/home-social';
import { ProviderError } from '@/services/providers/http';
import { instagram, parseInstagram } from '@/services/social/instagram';
import { isoTime, safeMedia, safePermalink, shortText } from '@/services/social/social-normalize';
import { clearSocialCache, getLatestSocial, setSocialSources } from '@/services/social/social-service';
import type { SocialPost } from '@/services/social/social-types';
import { parseX, xApi } from '@/services/social/x';

/** "Latest from INRGIFT": official APIs only, server-side, cached, nothing invented, each platform failing on its own. */
const NOW = new Date('2026-10-08T06:00:00Z');
const IG = { data: [
  { id: '1801', caption: 'Global markets this week: a short note from the INRGIFT team.', media_type: 'IMAGE', media_url: 'https://scontent.cdninstagram.com/v/t51/1.jpg', permalink: 'https://www.instagram.com/p/AAA111/', timestamp: '2026-10-05T12:34:56+0000', username: 'inrgift' },
  { id: '1802', caption: 'Product tour', media_type: 'VIDEO', media_url: 'https://scontent.cdninstagram.com/v/2.mp4', thumbnail_url: 'https://scontent.cdninstagram.com/v/2.jpg', permalink: 'https://www.instagram.com/reel/BBB222/', timestamp: '2026-10-07T08:00:00+0000', username: 'inrgift' },
  { id: '1803', caption: 'bad link', media_type: 'IMAGE', media_url: 'https://evil.example/x.jpg', permalink: 'https://evil.example/p/1', timestamp: '2026-10-07T09:00:00+0000' },
] };
const X = {
  data: [
    { id: '1840000000000000001', text: 'INRGIFT: every market, every asset, one research view.', created_at: '2026-10-06T10:00:00.000Z', author_id: '99', attachments: { media_keys: ['3_1'] } },
    { id: '1840000000000000002', text: 'A second post', created_at: '2026-10-07T10:00:00.000Z', author_id: '99' },
  ],
  includes: { media: [{ media_key: '3_1', type: 'photo', url: 'https://pbs.twimg.com/media/abc.jpg' }], users: [{ id: '99', username: 'INRGIFT' }] },
};

afterEach(() => { setSocialSources({}); clearSocialCache(); vi.unstubAllEnvs(); });

describe('normalisation', () => {
  it('links and images only from the platforms themselves, over https', () => {
    expect(safePermalink('instagram', 'https://www.instagram.com/p/AAA/')).toBe('https://www.instagram.com/p/AAA/');
    expect(safePermalink('instagram', 'http://www.instagram.com/p/AAA/')).toBeNull();
    expect(safePermalink('instagram', 'https://instagram.com.evil.example/p/')).toBeNull();
    expect(safePermalink('x', 'https://x.com/INRGIFT/status/1')).toBe('https://x.com/INRGIFT/status/1');
    expect(safePermalink('x', 'javascript:alert(1)')).toBeNull();
    expect(safeMedia('x', 'https://pbs.twimg.com/media/a.jpg', 'image')).toEqual({ kind: 'image', url: 'https://pbs.twimg.com/media/a.jpg' });
    expect(safeMedia('instagram', 'https://evil.example/a.jpg', 'image')).toBeNull();
  });
  it('text is shortened at a word, never rewritten; times parse to UTC or stay null', () => {
    expect(shortText('  a   b  ')).toBe('a b');
    expect(shortText('')).toBeNull();
    const long = shortText('word '.repeat(80))!;
    expect(long.length).toBeLessThanOrEqual(221);
    expect(long.endsWith('…')).toBe(true);
    expect(isoTime('2026-10-05T12:34:56+0000')).toBe('2026-10-05T12:34:56.000Z');
    expect(isoTime('not a date')).toBeNull();
  });
});

describe('Instagram API (official)', () => {
  it('reads only the documented fields; drops posts whose link is not instagram.com; video shows its thumbnail', () => {
    const posts = parseInstagram(IG, NOW);
    expect(posts.map((p) => p.id)).toEqual(['1801', '1802']);
    expect(posts[0]).toMatchObject({ platform: 'instagram', author: 'inrgift', published_at: '2026-10-05T12:34:56.000Z', media: { kind: 'image' }, permalink: 'https://www.instagram.com/p/AAA111/' });
    expect(posts[1].media).toEqual({ kind: 'video', url: 'https://scontent.cdninstagram.com/v/2.jpg' });
    expect(JSON.stringify(posts)).not.toMatch(/like|comment|view_count/i);
    expect(() => parseInstagram({ error: {} })).toThrow(ProviderError);
  });
  it('calls graph.instagram.com server-side; the token never appears in an error', async () => {
    const calls: string[] = [];
    const ok = (async (u: string) => { calls.push(u); return new Response(JSON.stringify(IG), { status: 200 }); }) as unknown as typeof fetch;
    await instagram({ accessToken: 'IGTOKEN', fetchImpl: ok }).latest(5, NOW);
    expect(new URL(calls[0]).host).toBe('graph.instagram.com');
    const denied = (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
    const err = await instagram({ accessToken: 'IGTOKEN', fetchImpl: denied }).latest(5).catch((e) => e);
    expect(err.code).toBe('INVALID_KEY');
    expect(String(err.message)).not.toContain('IGTOKEN');
    expect(() => instagram({ accessToken: '' })).toThrow(ProviderError);
  });
});

describe('X API v2 (official)', () => {
  it('author from the API, permalink built on x.com from the returned id, first photo only', () => {
    const posts = parseX(X, NOW);
    expect(posts[0]).toMatchObject({ platform: 'x', author: 'INRGIFT', permalink: 'https://x.com/INRGIFT/status/1840000000000000001', media: { kind: 'image', url: 'https://pbs.twimg.com/media/abc.jpg' } });
    expect(posts[1].media).toBeNull();
    expect(parseX({ meta: { result_count: 0 } })).toEqual([]);
    expect(() => parseX({ errors: [] })).toThrow(ProviderError);
  });
  it('looks the account up by username once, then reads its posts with the Bearer token in a header', async () => {
    const calls: { url: string; auth?: string }[] = [];
    const f = (async (url: string, init?: RequestInit) => {
      calls.push({ url, auth: (init?.headers as Record<string, string>)?.Authorization });
      return new Response(JSON.stringify(url.includes('/by/username/') ? { data: { id: '99', username: 'INRGIFT' } } : X), { status: 200 });
    }) as unknown as typeof fetch;
    const api = xApi({ bearerToken: 'XTOKEN', fetchImpl: f });
    await api.latest(2, NOW); await api.latest(2, NOW);
    expect(calls.filter((c) => c.url.includes('/by/username/INRGIFT'))).toHaveLength(1);
    expect(calls.every((c) => c.auth === 'Bearer XTOKEN' && !c.url.includes('XTOKEN'))).toBe(true);
    expect(new URL(calls[1].url).searchParams.get('max_results')).toBe('5');
  });
});

describe('social service', () => {
  const src = (posts: SocialPost[]) => ({ latest: vi.fn(async () => posts) });
  it('not configured: no posts and no call (nothing invented)', async () => {
    setSocialSources({ instagram: null, x: null });
    const feeds = await getLatestSocial(NOW);
    expect(feeds.map((f) => [f.platform, f.status, f.posts.length])).toEqual([['instagram', 'NOT_CONFIGURED', 0], ['x', 'NOT_CONFIGURED', 0]]);
  });
  it('newest first by publish time, two per platform, cached between requests', async () => {
    const ig = src(parseInstagram(IG, NOW));
    setSocialSources({ instagram: ig, x: src(parseX(X, NOW)) });
    const [a, b] = await getLatestSocial(NOW);
    expect(a.status).toBe('FRESH');
    expect(a.posts.map((p) => p.id)).toEqual(['1802', '1801']);
    expect(b.posts.map((p) => p.id)).toEqual(['1840000000000000002', '1840000000000000001']);
    const again = await getLatestSocial(new Date(NOW.getTime() + 60_000));
    expect(again[0].status).toBe('CACHED');
    expect(ig.latest).toHaveBeenCalledTimes(1);
  });
  it('one platform failing never hides the other; after a failure the last good posts are marked STALE', async () => {
    const failing = { latest: vi.fn(async () => { throw new ProviderError('x', 'RATE_LIMITED', 429); }) };
    setSocialSources({ instagram: src(parseInstagram(IG, NOW)), x: failing });
    const [ig, x] = await getLatestSocial(NOW);
    expect(ig.posts).toHaveLength(2);
    expect(x).toMatchObject({ status: 'UNAVAILABLE', posts: [] });
    clearSocialCache();
    const flaky = { latest: vi.fn().mockResolvedValueOnce(parseX(X, NOW)).mockRejectedValue(new ProviderError('x', 'UNAVAILABLE', 503)) };
    setSocialSources({ instagram: null, x: flaky });
    await getLatestSocial(NOW);
    const later = await getLatestSocial(new Date(NOW.getTime() + 2 * 3600_000));
    expect(later[1]).toMatchObject({ status: 'STALE', retrievedAt: NOW.toISOString() });
    expect(later[1].posts).toHaveLength(2);
  });
  it('the homepage section shows returned posts with their links, and follow cards (no posts) otherwise', async () => {
    setSocialSources({ instagram: src(parseInstagram(IG, NOW)), x: null });
    const html = renderToStaticMarkup(createElement('div', null, await HomeSocial()));
    expect(html).toContain('https://www.instagram.com/reel/BBB222/');
    expect(html).toContain('View on Instagram');
    expect(html).toContain('@inrgift');
    expect(html).toContain('once the official X connection is set up');
    expect(html).toContain('https://x.com/INRGIFT');
    expect(html).not.toContain('evil.example');
    expect(html).toMatch(/rel="noopener noreferrer/);
  });
});
