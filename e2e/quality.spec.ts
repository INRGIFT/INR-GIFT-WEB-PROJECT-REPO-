import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Release-quality checks: every registered route resolves, key pages pass automated accessibility rules, nothing
 * overflows horizontally at the QA widths, reduced motion is honoured, and failure cases degrade honestly.
 */
const PUBLIC = ['/', '/markets', '/markets/all', '/markets/India', '/assets', '/assets/stocks', '/assets/funds', '/stocks/AAPL', '/etfs/SPY', '/etfs/SPY/review', '/indices/NIFTY-50', '/fx/USD-INR', '/commodities/GOLD', '/bonds/US-10Y', '/reits/PLD',
  '/discover', '/discover/heatmap', '/discover/screener', '/discover/compare', '/discover/collections', '/discover/trending', '/research', '/research/stocks', '/research/etfs', '/research/markets', '/research/themes', '/research/sectors', '/research/countries',
  '/resources', '/resources/news', '/resources/earnings', '/resources/dividends', '/resources/ipo', '/resources/calendar', '/resources/learn', '/resources/glossary', '/resources/data',
  '/about', '/pricing', '/faq', '/support', '/contact', '/login', '/signup', '/verify', '/forgot-password', '/reset-password',
  '/legal/privacy', '/legal/terms', '/legal/cookies', '/legal/risk-disclosure', '/legal/refund', '/legal/grievance'];
const PRIVATE = ['/app', '/app/watchlist', '/app/alerts', '/app/screens', '/app/comparisons', '/app/collections', '/app/research', '/app/notes', '/app/history', '/app/recent', '/account/profile', '/account/settings', '/account/security', '/notifications'];

test.describe('routes', () => {
  test('every public route answers 200 and every private route redirects to sign in', async ({ request }) => {
    for (const path of PUBLIC) expect.soft((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(200);
    for (const path of PRIVATE) {
      const r = await request.get(path, { maxRedirects: 0 });
      expect.soft(r.status(), path).toBe(307);
      expect.soft(r.headers().location ?? '', path).toContain(`/login?next=${encodeURIComponent(path)}`);
    }
  });
  test('unknown entities are genuine 404s with recovery', async ({ page }) => {
    for (const path of ['/stocks/NOPE-123', '/markets/Atlantis', '/research/stocks/missing', '/no-such-page']) {
      const r = await page.goto(path);
      expect.soft(r?.status(), path).toBe(404);
    }
    await expect(page.getByRole('navigation', { name: 'Popular destinations' })).toBeVisible();
  });
  test('internal search, private and auth pages are noindex; health reports', async ({ request }) => {
    expect((await request.get('/search?q=apple')).headers()['x-robots-tag']).toContain('noindex');
    expect((await request.get('/login')).headers()['x-robots-tag']).toContain('noindex');
    const h = await request.get('/api/health');
    expect(h.status()).toBe(200);
    expect((await h.json()).status).toBe('ok');
    expect(h.headers()['content-security-policy'] ?? (await request.get('/')).headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  });
});

test.describe('accessibility', () => {
  for (const path of ['/', '/markets', '/stocks/AAPL', '/etfs/SPY', '/discover/heatmap', '/discover/screener', '/discover/compare?s=AAPL,MSFT', '/research/sectors/technology', '/resources/learn/etf-basics', '/resources/glossary/beta', '/login', '/signup']) {
    test(`no serious or critical axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
      expect(bad).toEqual([]);
    });
  }
});

test.describe('responsive', () => {
  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/', '/markets', '/stocks/AAPL', '/discover/heatmap', '/discover/screener', '/discover/compare?s=AAPL,MSFT,NVDA', '/research/sectors/technology', '/resources/news']) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect.soft(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
      }
    });
  }
});

test('reduced motion: transitions are effectively disabled', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/discover/heatmap');
  const d = await page.evaluate(() => getComputedStyle(document.querySelector('[role="group"] button') as Element).transitionDuration);
  expect(parseFloat(d)).toBeLessThan(0.01);
  await ctx.close();
});

test.describe('failure cases', () => {
  test('provider failure, missing history, missing holdings and unavailable market degrade honestly', async ({ page }) => {
    await page.goto('/commodities/NATGAS');
    await expect(page.getByText('The chart could not load')).toBeVisible();
    await page.goto('/markets/Saudi-Arabia');
    await expect(page.getByText('Data unavailable from source.').first()).toBeVisible();
    await page.goto('/markets/Brazil');
    await expect(page.getByText(/stale/i).first()).toBeVisible();
    const r = await page.request.get('/api/v1/etfs/INDA/holdings');
    expect((await r.json()).data).toBeNull();
  });
  test('no search result offers recovery; compare with a missing asset ignores it', async ({ page }) => {
    await page.goto('/search?q=zzzzqqq');
    await expect(page.getByText(/No results for/)).toBeVisible();
    await page.goto('/discover/compare?s=AAPL,NOPE');
    await expect(page.getByRole('link', { name: 'AAPL' }).first()).toBeVisible();
  });
  test('unauthorised and invalid requests are rejected', async ({ request }) => {
    expect((await request.post('/api/internal/ingest', { data: {} })).status()).toBe(401);
    expect((await request.get('/api/v1/assets?pageSize=9999')).status()).toBe(400);
    expect((await request.get('/auth/confirm?token_hash=x&type=nope', { maxRedirects: 0 })).headers().location).toContain('/login?error=link');
  });
});
