import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { asOfText } from '@/features/charts/chart-status';
import { HomeNews } from '@/features/home/home-news';
import { weekdays } from '@/features/home/hero';
import { ruleText } from '@/features/home/previews';
import { getHomeSnapshot, HOME_VIDEO_IDS, publicDataMode, settle, STRIP } from '@/features/home/snapshot';
import { istHours, spansOf, unionSpans } from '@/features/home/world-markets';
import { DEFAULT_TREE, isGroup, type Node, type Rule } from '@/features/screener/logic';
import { ProviderError } from '@/services/providers/http';
import { VIDEOS } from '@/services/content';
import { setNewsSource } from '@/services/news/news-provider';
import { clearNewsCache } from '@/services/news/news-service';
import type { RawArticle } from '@/services/news/news-types';

/** The public homepage: what it may show, how demo values are labelled, and that nothing on it is invented. */
const root = path.resolve(__dirname, '..');
const read = (p: string) => readFileSync(path.join(root, p), 'utf8');
const NOT_LIVE = ['LIVE', 'DELAYED', 'END_OF_DAY'];

describe('public display policy', () => {
  it('demo provider: shown and labelled; licensed provider: off unless the owner confirms display rights', () => {
    expect(publicDataMode({}, 'demo')).toBe('demo');
    expect(publicDataMode({ PUBLIC_MARKET_DATA: 'on' }, 'demo')).toBe('demo');
    expect(publicDataMode({}, 'nse')).toBe('off');
    expect(publicDataMode({ PUBLIC_MARKET_DATA: 'yes' }, 'real')).toBe('off');
    expect(publicDataMode({ PUBLIC_MARKET_DATA: 'on' }, 'nse')).toBe('licensed');
  });
  it('the switch is server-only and documented', () => {
    expect(read('.env.example')).toMatch(/^PUBLIC_MARKET_DATA=$/m);
    expect(read('.env.example')).not.toContain('NEXT_PUBLIC_MARKET_DATA');
  });
});

describe('homepage snapshot (demo provider)', () => {
  it('the hero holds no NIFTY (or any) chart: no bars are prepared, and the hero renders no chart or market value', async () => {
    const snap = await getHomeSnapshot(new Date(), 'demo');
    expect('hero' in snap).toBe(false);
    const hero = read('src/features/home/hero.tsx'), motion = read('src/features/home/hero-motion.tsx');
    for (const src of [hero, motion]) {
      expect(src).not.toMatch(/FinancialChart|NIFTY|getChartSeries|klinecharts/);
      // an illustration: no prices, values or trading controls
      expect(src).not.toMatch(/\b(Buy|Sell|Order|P&L|Portfolio)\b/);
    }
    expect(motion).toContain('Illustration · not market data');
    expect(motion).toContain('data-poster');
    // the reduced-motion still frame is defined
    expect(read('src/app/globals.css')).toMatch(/prefers-reduced-motion[\s\S]*\.hero-motion \.hero-scene\[data-poster\] \{ opacity: 1; \}/);
  });
  it('strip: three instruments per asset class, native currencies, no demo value labelled live, delayed or end of day', async () => {
    const snap = await getHomeSnapshot(new Date(), 'demo');
    expect(snap.strip.ok).toBe(true);
    const groups = snap.strip.ok ? snap.strip.value : [];
    expect(groups.map((g) => g.label)).toEqual(STRIP.map((g) => g.label));
    for (const g of groups) {
      expect(g.rows).toHaveLength(3);
      for (const a of g.rows) {
        expect(NOT_LIVE).not.toContain(a.status);
        expect(NOT_LIVE).not.toContain(a.meta.dataStatus);
        expect(a.currency).toMatch(/^[A-Z]{3}$/);
      }
    }
  });
  it('previews and sessions load; the screener example runs on the server', async () => {
    const snap = await getHomeSnapshot(new Date(), 'demo');
    expect(snap.markets.ok && snap.markets.value.length).toBeGreaterThan(10);
    expect(snap.equities.ok && snap.equities.value.every((a) => ['stock', 'etf', 'reit'].includes(a.cls))).toBe(true);
    expect(snap.compare.ok && snap.compare.value.map((a) => a.slug)).toEqual(['RELIANCE', 'AAPL', 'SAP']);
    expect(snap.research.ok && snap.research.value.length).toBeGreaterThan(0);
  });
  it('mode off: no prices, charts or results are even loaded; sessions (calendars) still are', async () => {
    const snap = await getHomeSnapshot(new Date(), 'off');
    expect(snap.strip.ok || snap.equities.ok || snap.compare.ok).toBe(false);
    expect(snap.markets.ok).toBe(true);
  });
});

describe('failure isolation', () => {
  it('a failing or slow part of the snapshot becomes one honest gap, never an error page', async () => {
    expect(await settle(async () => 42)).toEqual({ ok: true, value: 42 });
    expect(await settle(async () => { throw new Error('provider down'); })).toEqual({ ok: false });
    expect(await settle(() => new Promise((r) => setTimeout(() => r(1), 200)), 20)).toEqual({ ok: false });
  });
});

describe('homepage helpers', () => {
  it('weekdays, IST spans across midnight and region unions', () => {
    expect(weekdays([1, 2, 3, 4, 5])).toBe('Mon–Fri');
    expect(weekdays([7, 1, 2, 3, 4])).toBe('Mon, Tue, Wed, Thu, Sun');
    expect(spansOf({ istOpen: 19, istClose: 1.5 })).toEqual([[19, 24], [0, 1.5]]);
    expect(unionSpans([[9, 12], [11, 15], [16, 17], [0, 1]])).toEqual([[0, 1], [9, 15], [16, 17]]);
    expect(istHours('2026-10-07T12:39:00Z')).toEqual({ hours: 18 + 9 / 60, label: '18:09' });
  });
  it('chart times for India read IST; other venues keep their own zone', () => {
    expect(asOfText('2026-10-07T10:00:00Z', 'Asia/Kolkata')).toBe('07 Oct 2026, 15:30 IST');
    expect(asOfText('2026-10-06T20:00:00Z', 'America/New_York')).toMatch(/^06 Oct 2026, 16:00 /);
    expect(asOfText('2026-10-06T20:00:00Z', 'America/New_York')).not.toContain('IST');
  });
  it('the screen preview states the screener’s own starting rules in its own words', () => {
    const rules: Rule[] = [];
    const walk = (n: Node) => (isGroup(n) ? n.rules.forEach(walk) : rules.push(n));
    walk(DEFAULT_TREE);
    expect(rules.map(ruleText)).toEqual(['Market cap (USD) is at least 100 bn USD', 'Revenue growth is at least 10%', 'Dividend yield is at least 3%']);
  });
});

describe('the three product tours', () => {
  it('are the existing recordings, with posters, captions, real sizes and responsive WebP posters', () => {
    expect(HOME_VIDEO_IDS).toEqual(['product-walkthrough', 'universal-search', 'heatmap-drill-down']);
    for (const id of HOME_VIDEO_IDS) {
      const v = VIDEOS.find((x) => x.id === id)!;
      expect(v, id).toBeTruthy();
      for (const f of [v.src!, v.poster, v.captions!, `/media/posters/${id}-640.webp`, `/media/posters/${id}-1280.webp`]) expect(existsSync(path.join(root, 'public', f)), f).toBe(true);
    }
  });
  it('every recorded size matches its file, so the "loads when you press play" size is true', () => {
    for (const v of VIDEOS) if (v.src) expect(v.bytes, v.id).toBe(statSync(path.join(root, 'public', v.src)).size);
  });
  it('no video file outside the eight recordings was added', () => {
    const files = readdirSync(path.join(root, 'public/media')).filter((f) => /\.(webm|mp4|mov)$/.test(f)).sort();
    expect(files).toEqual(VIDEOS.map((v) => path.basename(v.src!)).sort());
  });
});

describe('homepage news', () => {
  afterEach(() => { setNewsSource(null); clearNewsCache(); });
  const raw = (id: string, title: string, over: Partial<RawArticle> = {}): RawArticle => ({ provider: 'newsdata.io', id, title, description: 'Publisher summary that must not be republished on the homepage.', url: `https://news.example.com/${id}`, image_url: null, source_id: 'example', source_name: 'Example Wire', source_url: null, source_priority: 100, published_at: new Date(Date.now() - 3600_000).toISOString(), provider_fetched_at: null, language: 'english', countries: ['india'], categories: ['business'], keywords: [], provider_duplicate: false, ...over });
  const render = async () => renderToStaticMarkup(createElement('div', null, await HomeNews()));

  it('without a news key: an honest state, never the demo fixtures', async () => {
    const html = await render();
    expect(html).toContain('demo headlines are never shown publicly');
    expect(html).not.toMatch(/\(demo\)|Demo fixture/);
  });
  it('with NewsData.io: headline, source, time, category; links to the publisher; no summaries or images', async () => {
    setNewsSource({ name: 'newsdata.io', latest: async () => ({ items: [raw('n1', 'Sensex and Nifty rise as RBI holds the repo rate; rupee steadies'), raw('n2', 'Reliance Industries shares gain after quarterly results')], nextPage: null }) });
    const html = await render();
    expect(html).toContain('Sensex and Nifty rise as RBI holds the repo rate');
    expect(html).toContain('href="https://news.example.com/n1"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('Example Wire');
    expect(html).toMatch(/Retrieved .* IST from NewsData\.io/);
    expect(html).not.toContain('Publisher summary');
    expect(html).not.toContain('<img');
  });
  it('provider failure: says so and shows nothing in place of headlines', async () => {
    setNewsSource({ name: 'newsdata.io', latest: async () => { throw new ProviderError('newsdata.io', 'QUOTA'); } });
    const html = await render();
    expect(html).toContain('Headlines are unavailable right now');
    expect(html).not.toContain('news.example.com');
  });
});

describe('homepage copy and boundaries', () => {
  const files = ['src/app/(site)/page.tsx', ...readdirSync(path.join(root, 'src/features/home')).map((f) => `src/features/home/${f}`), 'src/components/layout/site-header.tsx', 'src/components/layout/site-footer.tsx'];
  const text = files.map(read).join('\n');
  it('no trading language, return promises or invented proof', () => {
    expect(text).not.toMatch(/\b(buy now|sell now|trade now|start trading|place (an )?order|portfolio|brokerage account|guaranteed|risk-free|beat the market|high returns|testimonial|trusted by|award)/i);
    expect(text).not.toMatch(/\b\d[\d,]*\+?\s+(users|customers|clients|exchanges|institutions)\b/i);
  });
  it('the homepage never calls the protected API or a vendor from the browser', () => {
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    expect(code).not.toMatch(/fetch\(|\/api\/v1|newsdata\.io\/api/);
  });
  it('SEO: the brief’s title, an indexable canonical root, and demo values kept out of snippets', () => {
    const page = read('src/app/(site)/page.tsx');
    expect(page).toContain("title: 'INRGIFT | Global Market Intelligence From India'");
    expect(page).toContain("path: '/'");
    // Files that show demo values; the hero shows none (an illustration).
    for (const f of ['src/features/home/market-strip.tsx', 'src/features/home/previews.tsx']) expect(read(f), f).toContain('data-nosnippet');
  });
});
