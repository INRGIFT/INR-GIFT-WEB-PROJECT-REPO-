import { expect, test } from '@playwright/test';
import { signInDemo } from './fixtures';

const GIFT = /^GIFT-[0-9A-HJKMNP-TV-Z]{8}$/;

test('workspace home: Hola AMIGO greeting, every module with honest states, no time-of-day greeting', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1, name: 'Hola AMIGO, E2E' })).toBeVisible();
  await expect(page.getByText('Welcome back to your global market research workspace.')).toBeVisible();
  await expect(page.getByText(/Good (morning|afternoon|evening)/)).toHaveCount(0);
  for (const name of ['Global market overview', 'Quick research', 'Market news', 'Saved research', 'Alerts']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  // Market overview: real demo rows with a data status and a source line.
  const overview = page.getByRole('table', { name: /Benchmark indices/ });
  await expect(overview.getByRole('rowheader', { name: /NIFTY 50/ })).toBeVisible();
  await expect(page.getByText(/^Source: /).first()).toBeVisible();
  // Empty workspace modules say so plainly (the fixture account has no saved rows).
  await expect(page.getByText('Your watchlists will appear here.')).toBeVisible();
  await expect(page.getByText('Research you save will appear here.')).toBeVisible();
  await expect(page.getByText('Your alerts will appear here.')).toBeVisible();
  // Nothing on the page offers trading.
  await expect(page.getByText(/\b(buy now|sell now|trade now|place order|portfolio)\b/i)).toHaveCount(0);
});

test('navigation: grouped sidebar (desktop) or drawer (mobile), account menu with the GIFT ID', async ({ page, isMobile }) => {
  await signInDemo(page);
  await page.goto('/app');
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
  for (const name of ['Home', 'Discover', 'Markets', 'Screeners', 'Compare', 'Research', 'News', 'Watchlists', 'Alerts', 'Saved Research', 'Profile', 'Security', 'Sessions', 'Preferences', 'Support', 'Grievance Redressal', 'Account Closure']) {
    await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page');
  if (isMobile) await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Account menu' }).click();
  await expect(page.getByRole('menu').getByText(/GIFT ID GIFT-[0-9A-HJKMNP-TV-Z]{8}/)).toBeVisible();
});

test('profile: INRGIFT ACCOUNT card with the GIFT ID, Copy GIFT ID copies it and confirms', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await signInDemo(page);
  await page.goto('/account/profile');
  const card = page.getByRole('region', { name: 'INRGIFT account' });
  const id = card.getByText(GIFT);
  await expect(id).toBeVisible();
  const shown = (await id.textContent())!.trim();
  await expect(card.getByText('Your GIFT ID is your permanent INRGIFT account reference. Use it when contacting INRGIFT support.')).toBeVisible();
  for (const label of ['Full name', 'Email', 'Phone', 'Country', 'Account created']) await expect(card.getByText(label, { exact: true })).toBeVisible();
  await expect(card.getByText(/an•+@example\.com/)).toBeVisible(); // masked email
  await card.getByRole('button', { name: 'Copy GIFT ID' }).click();
  await expect(card.getByRole('button', { name: 'GIFT ID copied ✓' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shown);
  // The same GIFT ID on every read, and nowhere in the URL.
  await page.reload();
  await expect(page.getByRole('region', { name: 'INRGIFT account' }).getByText(GIFT)).toHaveText(shown);
  expect(page.url()).not.toContain('GIFT-');
});

test('sessions and security pages show only verifiable facts', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/account/sessions');
  await expect(page.getByRole('heading', { level: 1, name: 'Sessions' })).toBeVisible();
  await expect(page.getByText('Current session')).toBeVisible();
  await expect(page.getByText('Demo sessions exist only in this browser. There are no other devices to sign out.')).toBeVisible();
  await page.goto('/account/security');
  await expect(page.getByRole('heading', { level: 1, name: 'Security' })).toBeVisible();
  for (const name of ['Password', 'Sign-in identity', 'Verification', 'Sessions', 'Recent security activity']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
});

test('news page: GLOBAL MARKET NEWS layout, featured story, categories and market pulse', async ({ page, isMobile }) => {
  await signInDemo(page);
  await page.goto('/resources/news');
  await expect(page.getByRole('heading', { level: 1, name: 'Global market news' })).toBeVisible();
  await expect(page.getByText('Market-moving news, macro developments, company events and financial intelligence.')).toBeVisible();
  await expect(page.getByText('Featured', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Market pulse' })).toBeVisible();
  const categories = page.getByRole('navigation', { name: 'News categories' });
  for (const name of ['Top stories', 'Economy & macro', 'Bonds & rates', 'M&A', 'Supply chain']) await expect(categories.getByRole('link', { name, exact: true })).toBeVisible();
  await categories.getByRole('link', { name: 'Dividends', exact: true }).click();
  await expect(page).toHaveURL(/section=dividends/);
  await expect(page.getByRole('heading', { level: 2, name: 'Dividends' })).toBeVisible();
  if (isMobile) {
    await page.getByRole('button', { name: /Filters/ }).click();
    await expect(page.getByLabel('Topic')).toBeVisible();
  } else await expect(page.getByLabel('Topic')).toBeVisible();
});
