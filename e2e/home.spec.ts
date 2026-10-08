import { expect, test } from '@playwright/test';
import { signInDemo } from './fixtures';

/**
 * The public homepage (demo build): brand, navigation, the server-prepared demo snapshot (labelled DEMO, never live),
 * the three existing product tours, honest news and footer, and the product staying behind sign-in.
 */
const NAV: [string, string][] = [['Markets', '/markets'], ['Discover', '/discover'], ['Screeners', '/discover/screener'], ['Compare', '/discover/compare'], ['Research', '/research'], ['News', '/news']];

test('brand hero, navigation and calls to action; product links lead to sign-in', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('INRGIFT | Global Market Intelligence From India');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\s*invest\s*beyond\s*borders\.\s*$/i);
  await expect(page.getByText('Global market intelligence from India').first()).toBeVisible();
  await expect(page.getByText('One research view for global markets, assets, companies and financial intelligence.')).toBeVisible();
  await expect(page.getByText('Research-first. Global by design.')).toBeVisible();
  const banner = page.getByRole('banner');
  await expect(banner.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login');
  await expect(banner.getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/signup');
  if (isMobile) {
    await banner.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByRole('navigation', { name: 'Main menu' });
    for (const [name, href] of NAV) await expect(menu.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
    await page.keyboard.press('Escape');
  } else {
    const nav = banner.getByRole('navigation', { name: 'Primary' });
    for (const [name, href] of NAV) await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  // Nothing offers trading, and no return is promised.
  await expect(page.getByText(/\b(buy now|sell now|trade now|start trading|place order|guaranteed returns?)\b/i)).toHaveCount(0);
  await page.getByRole('main').getByRole('link', { name: 'Explore Markets' }).first().click();
  await expect(page).toHaveURL(/\/login\?next=%2Fmarkets/);
});

test('hero chart and market strip: KLineChart draws demo data labelled DEMO, never live, and periods switch without the API', async ({ page }) => {
  const api: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/api/v1/')) api.push(r.url()); });
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'NIFTY 50 chart' });
  await expect(hero.locator('canvas').first()).toBeVisible();
  await expect(hero.getByText(/^◇?Demo data$/).first()).toBeVisible();
  await expect(hero.getByText('Source: demo-provider')).toBeVisible();
  await expect(hero.getByText(/^Live$/)).toHaveCount(0);
  await expect(hero.getByText(/\d+ bars · Daily/)).toBeVisible();
  const yearBars = Number((await hero.getByText(/\d+ bars · Daily/).textContent())!.match(/(\d+) bars/)![1]);
  await hero.getByRole('group', { name: 'Time range' }).getByRole('button', { name: '1M', exact: true }).click();
  await expect.poll(async () => Number(((await hero.getByText(/\d+ bars · Daily/).textContent()) ?? '').match(/(\d+) bars/)?.[1] ?? 0)).toBeLessThan(yearBars);
  await hero.getByRole('group', { name: 'Time range' }).getByRole('button', { name: '5Y', exact: true }).click();
  await expect(hero.getByText(/\d+ bars · Weekly/)).toBeVisible();
  const facts = page.getByRole('definition').filter({ hasText: 'Simulated values, labelled DEMO' });
  await expect(facts).toBeVisible();
  const strip = page.getByRole('region', { name: 'Global market snapshot' });
  await expect(strip.getByText(/^◇?Demo data$/).first()).toBeVisible();
  for (const name of ['NIFTY 50', 'Reliance Industries', 'USD / INR', 'Gold', 'US Treasury 10-Year Note', 'SPDR S&P 500 ETF Trust']) await expect(strip.getByText(name, { exact: true })).toBeAttached();
  await expect(strip.getByText(/^Live$/)).toHaveCount(0);
  expect(api).toEqual([]);
});

test('the three product tours: nothing downloads until play; play loads one captioned video; tours switch', async ({ page }) => {
  const media: string[] = [];
  page.on('request', (r) => { if (/\.(webm|mp4)(\?|$)/.test(r.url())) media.push(new URL(r.url()).pathname); });
  await page.goto('/');
  const tours = page.getByRole('region', { name: 'See how INRGIFT works.' });
  await tours.scrollIntoViewIfNeeded();
  const list = tours.getByRole('list', { name: 'Product tours' });
  for (const t of ['INRGIFT in 60 seconds', 'Universal search', 'Read the global heatmap']) await expect(list.getByText(t, { exact: true })).toBeVisible();
  await expect(tours.locator('video')).toHaveCount(0);
  expect(media).toEqual([]);
  await tours.getByRole('button', { name: 'Play video: INRGIFT in 60 seconds, 0:42' }).click();
  const video = tours.locator('video');
  await expect(video).toHaveCount(1);
  await expect(video.locator('source')).toHaveAttribute('src', '/media/product-walkthrough.webm');
  await expect(video.locator('track[kind="captions"]')).toHaveAttribute('src', '/media/product-walkthrough.en.vtt');
  await expect.poll(() => media).toContain('/media/product-walkthrough.webm');
  await list.getByRole('button', { name: /Universal search, 0:27/ }).click();
  await expect(tours.getByRole('heading', { level: 3, name: 'Universal search' })).toBeVisible();
  await expect(tours.locator('video source')).toHaveAttribute('src', '/media/universal-search.webm');
  await expect(tours.locator('video')).toHaveCount(1);
  await tours.getByRole('button', { name: 'Transcript' }).click();
  await expect(tours.getByText('Press / or Ctrl+K on any page to open universal search.')).toBeVisible();
});

test('news, research, screen and compare previews: honest states and real product structure', async ({ page }) => {
  await page.goto('/');
  const news = page.getByRole('region', { name: 'Know what moved the market.' });
  await expect(news.getByText(/demo headlines are never shown publicly/)).toBeVisible();
  await expect(news.getByRole('navigation', { name: 'News categories' }).getByRole('link', { name: 'Top stories' })).toHaveAttribute('href', '/news?section=most-relevant');
  const screen = page.getByRole('region', { name: 'Find what matters.' });
  await expect(screen.getByText('Market cap (USD) is at least 100 bn USD')).toBeVisible();
  await expect(screen.getByText(/^\d+ (match|matches)/)).toBeVisible();
  await expect(screen.getByRole('link', { name: 'Sign In to Screen' })).toHaveAttribute('href', '/login?next=%2Fdiscover%2Fscreener');
  const compare = page.getByRole('region', { name: 'Compare before you conclude.' });
  await expect(compare.getByRole('rowheader', { name: '1 year return' })).toBeVisible();
  await expect(compare.getByText(/^◇?Demo data$/).first()).toBeVisible();
  const research = page.getByRole('region', { name: 'Turn market data into research.' });
  for (const s of ['Key takeaways', 'Limitations', 'Methodology', 'Sources']) await expect(research.getByText(s, { exact: true })).toBeVisible();
});

test('footer: product, account, support, legal and company columns; published contact details only', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  const cols: [string, string[]][] = [['Product', ['Markets', 'Discover', 'Screeners', 'Compare', 'Research', 'News']], ['Account', ['Profile', 'Security', 'Sessions', 'Preferences']], ['Support', ['Support', 'Grievance Redressal', 'Account Closure']], ['Legal', ['Terms and Conditions', 'Privacy Policy', 'Legal', 'Risk Disclaimer', 'Cookie Policy', 'Open-source notices']], ['Company', ['About']]];
  for (const [col, links] of cols) for (const l of links) await expect(footer.getByRole('navigation', { name: col }).getByRole('link', { name: l, exact: true })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'support@inrgift.com' })).toBeVisible();
  await expect(footer.getByText('Surat, Gujarat 395009')).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
});

test('signed in: calls to action open the product instead of sign-up', async ({ page, isMobile }) => {
  await signInDemo(page);
  await page.goto('/');
  if (!isMobile) await expect(page.getByRole('banner').getByRole('link', { name: 'Open Workspace' })).toHaveAttribute('href', '/app');
  await expect(page.getByRole('main').getByRole('link', { name: 'Open Your Workspace' }).first()).toHaveAttribute('href', '/app');
  await expect(page.getByRole('main').getByRole('link', { name: 'Explore Screeners' })).toHaveAttribute('href', '/discover/screener');
  await expect(page.getByRole('banner').getByRole('link', { name: 'Get Started' })).toHaveCount(0);
});

test('motion: below-the-fold sections reveal once scrolled to; with reduced motion nothing is ever hidden', async ({ page, browser }) => {
  await page.goto('/');
  await expect.poll(() => page.locator('[data-reveal="pending"]').count()).toBeGreaterThan(0);
  for (let y = 0; y < 60; y += 1) { await page.evaluate(() => window.scrollBy(0, 400)); await page.waitForTimeout(50); }
  await expect.poll(() => page.locator('[data-reveal="pending"]').count(), { timeout: 15_000 }).toBe(0);
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const calm = await ctx.newPage();
  await calm.goto('/');
  await calm.waitForTimeout(500);
  expect(await calm.locator('[data-reveal="pending"]').count()).toBe(0);
  await ctx.close();
});

test('every link on the homepage resolves (public page or sign-in redirect, never a 404), and no secret is in the page', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = [...new Set(await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!)))];
  expect(hrefs.length).toBeGreaterThan(30);
  for (const href of hrefs) {
    const r = await request.get(href, { maxRedirects: 0 });
    expect.soft([200, 307, 308], href).toContain(r.status());
    if (r.status() === 307) expect.soft(r.headers().location ?? '', href).toContain('/login?next=');
  }
  const html = await (await request.get('/')).text();
  expect(html).not.toMatch(/sb_secret|service_role|X-ACCESS-KEY|NEWSIO_API_KEY|RESEND_API_KEY|re_[A-Za-z0-9]{16}|pub_[0-9a-f]{20}/);
});
