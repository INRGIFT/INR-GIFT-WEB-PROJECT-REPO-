import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { signInDemo } from './fixtures';

/**
 * Release-quality checks on a demo build (NEXT_PUBLIC_AUTH_MODE=demo).
 * Access model: "/" and the compliance pages are public (plus auth pages); every other page and /api route needs a verified session (src/lib/route-registry.ts). Signed-in checks use the demo session fixture.
 */
const PUBLIC = ['/', '/terms-and-conditions', '/privacy-policy', '/about', '/support', '/account-closure', '/grievance-redressal', '/legal', '/legal/risk-disclaimer', '/legal/cookie-policy', '/legal/refund'];
const AUTH = ['/login', '/signup', '/verify', '/verify-phone', '/complete-profile', '/forgot-password', '/reset-password'];
const PROTECTED = ['/markets', '/markets/all', '/markets/India', '/assets', '/assets/stocks', '/assets/funds', '/stocks/AAPL', '/etfs/SPY', '/etfs/SPY/review', '/indices/NIFTY-50', '/fx/USD-INR', '/commodities/GOLD', '/bonds/US-10Y', '/reits/PLD',
  '/discover', '/discover/heatmap', '/discover/screener', '/discover/compare', '/discover/collections', '/discover/trending', '/research', '/research/stocks', '/research/etfs', '/research/markets', '/research/themes', '/research/sectors', '/research/countries', '/research/sectors/technology',
  '/resources', '/resources/news', '/resources/earnings', '/resources/dividends', '/resources/ipo', '/resources/calendar', '/resources/learn', '/resources/learn/etf-basics', '/resources/glossary', '/resources/glossary/beta', '/resources/data',
  '/search', '/pricing', '/faq', '/app', '/app/watchlist', '/app/alerts', '/app/screens', '/app/comparisons', '/app/collections', '/app/research', '/app/notes', '/app/history', '/app/recent', '/account/profile', '/account/settings', '/account/security', '/account/sessions', '/notifications', '/onboarding'];
const APIS = ['/api/v1/assets', '/api/v1/assets/AAPL', '/api/v1/search?q=apple', '/api/v1/markets', '/api/v1/fx-rates', '/api/v1/news', '/api/v1/news/feed', '/api/v1/research'];
const base = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const signedIn = async (playwright: { request: { newContext: (o: object) => Promise<APIRequestContext> } }) => playwright.request.newContext({ baseURL: base, extraHTTPHeaders: { Cookie: 'inrgift_demo_session=1' } });

test.describe('access: homepage and compliance pages are public', () => {
  test('anonymous: public and auth pages answer 200; every product page redirects to sign in with the full return path', async ({ request }) => {
    for (const path of [...PUBLIC, ...AUTH]) expect.soft((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(200);
    for (const path of [...PROTECTED, '/discover/screener?market=us&sector=technology', '/stocks/AAPL.png', '/some-future-route']) {
      const r = await request.get(path, { maxRedirects: 0 });
      expect.soft(r.status(), path).toBe(307);
      expect.soft(r.headers().location ?? '', path).toContain(`/login?next=${encodeURIComponent(path)}`);
    }
  });
  test('anonymous: data APIs answer 401 JSON and leak nothing; prefetch requests are redirected too', async ({ request }) => {
    for (const path of APIS) {
      const r = await request.get(path);
      expect.soft(r.status(), path).toBe(401);
      const body = await r.json();
      expect.soft(body.error?.code, path).toBe('UNAUTHENTICATED');
      expect.soft(body.data, path).toBeUndefined();
    }
    // Old legal and contact URLs redirect permanently to the canonical compliance URLs, signed out.
    for (const [from, to] of [['/legal/terms', '/terms-and-conditions'], ['/legal/privacy', '/privacy-policy'], ['/legal/grievance', '/grievance-redressal'], ['/contact', '/support'], ['/legal/risk-disclosure', '/legal/risk-disclaimer']]) {
      const r = await request.get(from, { maxRedirects: 0 });
      expect.soft(r.status(), from).toBe(308);
      expect.soft(r.headers().location ?? '', from).toContain(to);
    }
    const prefetch = await request.get('/markets', { maxRedirects: 0, headers: { RSC: '1', 'Next-Router-Prefetch': '1' } });
    expect(prefetch.status()).toBe(307);
  });
  test('signed in: product pages and APIs work, private and uncacheable; unknown entities are real 404s', async ({ playwright }) => {
    const auth = await signedIn(playwright);
    for (const path of PROTECTED.filter((p) => p !== '/onboarding')) {
      const r = await auth.get(path, { maxRedirects: 0 });
      expect.soft(r.status(), path).toBe(200);
      expect.soft(r.headers()['cache-control'] ?? '', path).toMatch(/private|no-store/);
      expect.soft(r.headers()['x-robots-tag'] ?? '', path).toContain('noindex');
    }
    for (const path of APIS) expect.soft((await auth.get(path)).status(), path).toBe(200);
    for (const path of ['/stocks/NOPE-123', '/markets/Atlantis', '/research/stocks/missing']) expect.soft((await auth.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
    expect((await auth.get('/api/v1/assets?pageSize=9999')).status()).toBe(400);
    await auth.dispose();
  });
  test('SEO: public pages are indexable with canonical URLs; robots and sitemap publish no product routes; health reports safely', async ({ request }) => {
    expect((await request.get('/')).headers()['x-robots-tag'] ?? '').not.toContain('noindex');
    expect((await request.get('/login')).headers()['x-robots-tag']).toContain('noindex');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /');
    expect(robots).toContain('Allow: /account-closure$');
    expect(robots).not.toMatch(/Allow: \/(markets|stocks|app|discover|research)/);
    const sitemap = await (await request.get('/sitemap/core.xml')).text();
    expect(sitemap).toContain('/terms-and-conditions');
    expect(sitemap).not.toMatch(/\/(stocks|markets|research|discover|resources|app)\b/);
    for (const path of ['/terms-and-conditions', '/privacy-policy', '/about', '/support', '/account-closure', '/grievance-redressal']) {
      const html = await (await request.get(path)).text();
      expect.soft(html, path).toMatch(new RegExp(`<link rel="canonical" href="https?://[^"]+${path.replace('/', '\\/')}"`));
      expect.soft(html, path).not.toContain('noindex');
    }
    const h = await request.get('/api/health');
    expect(h.status()).toBe(200);
    expect(JSON.stringify(await h.json())).not.toMatch(/re_|whsec_|sb_secret|eyJ/);
    const j = await h.json();
    expect(j.status).toBe('ok');
    expect(JSON.stringify(j)).not.toMatch(/re_|sk_|whsec|secret_key|apikey/i);
    expect((await request.get('/')).headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  });
  test('homepage: demo values labelled DEMO and kept out of search snippets; leads to sign up and sign in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/signup');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Global market snapshot' }).getByText(/^◇?Demo data$/).first()).toBeVisible();
    expect(await page.locator('[data-nosnippet]').count()).toBeGreaterThan(2);
    for (const t of ['Market news', 'Upcoming', 'Reference rate']) await expect(page.getByText(t, { exact: true })).toHaveCount(0);
    await page.getByRole('main').getByRole('link', { name: 'Explore Markets' }).first().click();
    await expect(page).toHaveURL(/\/login\?next=%2Fmarkets/);
    await expect(page.getByRole('link', { name: 'Create your account' })).toHaveAttribute('href', '/signup?next=%2Fmarkets');
  });
});

test.describe('accessibility', () => {
  const check = async (page: import('@playwright/test').Page) => {
    await page.waitForLoadState('networkidle');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  };
  for (const path of ['/', '/login', '/signup', '/support', '/account-closure', '/grievance-redressal', '/terms-and-conditions']) test(`no serious or critical axe violations on ${path} (public)`, async ({ page }) => { await page.goto(path); expect(await check(page)).toEqual([]); });
  for (const path of ['/markets', '/stocks/AAPL', '/etfs/SPY', '/discover/heatmap', '/discover/screener', '/discover/compare?s=AAPL,MSFT', '/research/sectors/technology', '/resources/news', '/resources/learn/etf-basics', '/resources/glossary/beta', '/account/security']) {
    test(`no serious or critical axe violations on ${path} (signed in)`, async ({ page }) => { await signInDemo(page); await page.goto(path); expect(await check(page)).toEqual([]); });
  }
});

test.describe('responsive', () => {
  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      expect.soft(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `/ at ${width}px`).toBeLessThanOrEqual(1);
      await signInDemo(page);
      for (const path of ['/markets', '/stocks/AAPL', '/discover/heatmap', '/discover/screener', '/discover/compare?s=AAPL,MSFT,NVDA', '/research/sectors/technology', '/resources/news']) {
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
  await signInDemo(page);
  await page.goto('/discover/heatmap');
  const d = await page.evaluate(() => getComputedStyle(document.querySelector('[role="group"] button') as Element).transitionDuration);
  expect(parseFloat(d)).toBeLessThan(0.01);
  await ctx.close();
});

test.describe('news', () => {
  test('filters, search, relevance filtering, empty and provider-error states', async ({ page }) => {
    await signInDemo(page);
    await page.goto('/resources/news');
    await expect(page.getByText('Demo headlines', { exact: true })).toBeVisible();
    await expect(page.getByText(/low-relevance stor(y|ies) hidden/)).toBeVisible();
    await expect(page.getByText('Demo: Cricket league final draws record television audience')).toHaveCount(0);
    await expect(page.getByRole('article').first()).toBeVisible();
    await expect(page.getByRole('article').first().getByText(/INRGIFT relevance:/)).toBeVisible();
    await page.getByRole('link', { name: 'Commodities', exact: true }).click();
    await expect(page).toHaveURL(/section=commodities/);
    await page.getByLabel('Search news').fill('zzzz no such story');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText(/No results for|No stories/)).toBeVisible();
    await page.goto('/resources/news?q=provider-outage-test');
    await expect(page.getByText('News is unavailable')).toBeVisible();
    await expect(page.getByText(/Market data, research and your workspace are not affected/)).toBeVisible();
  });
});

test.describe('failure cases', () => {
  test('provider failure, unavailable and stale markets, missing holdings degrade honestly', async ({ page }) => {
    await signInDemo(page);
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
    await signInDemo(page);
    await page.goto('/search?q=zzzzqqq');
    await expect(page.getByText(/No results for/).first()).toBeVisible();
    await page.goto('/discover/compare?s=AAPL,NOPE');
    await expect(page.getByRole('link', { name: 'AAPL' }).first()).toBeVisible();
  });
  test('unauthorised and invalid requests are rejected', async ({ request }) => {
    expect((await request.post('/api/internal/ingest', { data: {} })).status()).toBe(401);
    expect((await request.post('/api/hooks/send-email', { data: {} })).status()).toBeGreaterThanOrEqual(401);
    expect((await request.get('/auth/confirm?token_hash=x&type=nope', { maxRedirects: 0 })).headers().location).toContain('/login?error=link');
  });
});
