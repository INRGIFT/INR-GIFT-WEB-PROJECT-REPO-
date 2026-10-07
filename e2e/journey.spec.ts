import { expect, test, type Page } from '@playwright/test';
import { signInDemo } from './fixtures';

/**
 * The acceptance journey from docs/QA.md, run in demo mode (no Supabase): accounts live in the browser, the email
 * link is a button and every SMS code is 123456. Required-credential cases are in e2e/auth.spec.ts.
 * Each test starts from a clean browser context, so state never leaks between tests.
 */
const CODE = '123456';
const PASSWORD = 'research-2026!';
const email = () => `e2e.${Date.now()}@example.com`;

async function signUp(page: Page) {
  const address = email();
  await page.goto('/signup');
  await page.getByLabel('Full name').fill('Asha Rao');
  await page.getByLabel('Email', { exact: true }).fill(address);
  await page.getByLabel('Mobile number').fill('+91 98765 43210');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await page.getByRole('button', { name: /Open the verification link/ }).click();
  await page.getByLabel('Email', { exact: true }).fill(address);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Verify your mobile number' })).toBeVisible();
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('SMS code').fill(CODE);
  await page.getByRole('button', { name: 'Verify number' }).click();
  await expect(page.getByRole('heading', { name: 'How should prices appear?' })).toBeVisible();
  return address;
}

test('signed-in research flow: search, asset, chart, compare, heatmap, screener', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every market');
  await page.keyboard.press('/');
  await page.getByRole('combobox', { name: /Search assets/ }).fill('AAPL');
  await expect(page.getByRole('listbox', { name: 'Search results' }).getByRole('option').first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/stocks\/AAPL/);
  await expect(page.getByRole('img', { name: /AAPL 1Y price chart/ })).toBeVisible();
  await page.getByRole('button', { name: '5Y', exact: true }).click();
  await expect(page.getByRole('img', { name: /AAPL 5Y price chart/ })).toBeVisible();
  await page.goto('/discover/compare?s=AAPL,NVDA,MSFT');
  await expect(page.getByRole('heading', { name: 'Metrics' })).toBeVisible();
  await page.goto('/discover/heatmap');
  await page.locator('button[title^="Drill into"]').first().click();
  await expect(page.getByRole('navigation', { name: 'Drill-down' }).getByRole('button')).toHaveCount(2);
  await page.goto('/discover/screener');
  await expect(page.getByText(/of \d+ match/)).toBeVisible();
});

test('account journey: sign up, verify email and phone, onboarding, workspace, sign out, sign in with SMS', async ({ page }) => {
  const address = await signUp(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /and finish|^Finish$/ }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

  // Watchlist: the onboarding picks are there; add one more by search.
  await page.goto('/app/watchlist');
  await page.getByRole('combobox', { name: /Add an asset/ }).fill('Infosys');
  await page.getByRole('option', { name: /Infosys/ }).click();
  await expect(page.getByRole('link', { name: /Infosys/ }).first()).toBeVisible();

  // Alert from an asset page, then visible in Alerts.
  await page.goto('/stocks/AAPL');
  await page.getByRole('button', { name: 'Add alert' }).click();
  await page.getByLabel('Notify me when').selectOption('pct_move');
  await page.getByLabel('Move (%)').fill('1');
  await page.getByRole('button', { name: 'Create alert', exact: true }).click();
  await page.goto('/app/alerts');
  await expect(page.getByText('One-day move exceeds (%) 1.0%')).toBeVisible();

  // Sign out, then sign in again: email + password, then the SMS code.
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
  await page.getByLabel('Email', { exact: true }).fill(address);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Enter the code sent to your phone' })).toBeVisible();
  await page.getByLabel('SMS code').fill(CODE);
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('link', { name: /Infosys/ }).first()).toBeVisible();
});

test('signed out: direct URLs to product pages go to sign in, never to content', async ({ page }) => {
  for (const path of ['/markets', '/discover', '/resources/news', '/stocks/AAPL', '/etfs/SPY', '/indices/NIFTY-50', '/fx/USD-INR', '/research', '/app', '/account/profile', '/notifications']) {
    await page.goto(path);
    await expect(page, path).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
    await expect(page.getByRole('heading', { name: 'Sign in to INRGIFT' })).toBeVisible();
  }
});

test('error and unavailable states render without breaking the page', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/commodities/NATGAS');
  await expect(page.getByText('The chart could not load')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await page.goto('/markets/Saudi-Arabia');
  await expect(page.getByText('Data unavailable from source.').first()).toBeVisible();
  const res = await page.request.get('/api/v1/assets/does-not-exist');
  expect(res.status()).toBe(404);
  expect((await res.json()).error.code).toBe('NOT_FOUND');
});

test('stock and ETF logos fall back to ticker tiles and never show a broken image', async ({ page }) => {
  await signInDemo(page);
  // The logo CDN is stubbed: one logo loads, every other request fails. Runs whether or not a logo provider is configured.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  await page.route('https://img.logo.dev/**', (r) => (r.request().url().includes('/ticker/AAPL?') ? r.fulfill({ status: 200, contentType: 'image/png', body: png }) : r.fulfill({ status: 404, body: '' })));
  await page.goto('/assets/stocks');
  await expect(page.getByRole('link', { name: /Apple/ }).first()).toBeVisible();
  await page.mouse.wheel(0, 4000);
  await page.waitForLoadState('networkidle');
  const broken = await page.$$eval('img', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
  expect(broken).toEqual([]);
  // Every row keeps a readable ticker tile under (or instead of) the logo.
  await expect(page.getByRole('link', { name: /Microsoft/ }).first()).toContainText('MSFT');
});

test('research structure, sector and country research, identity and heatmap explainer', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/research');
  await expect(page.getByRole('link', { name: /Sector research/ }).first()).toHaveAttribute('href', '/research/sectors');
  await page.goto('/research/sectors');
  const note = page.getByRole('link', { name: /Technology across markets/ }).first();
  await expect(note).toHaveAttribute('href', '/research/sectors/technology');
  await page.goto('/research/sectors/technology');
  for (const h of ['Key takeaways', 'Why it matters', 'Interpretation', 'Limitations', 'Methodology', 'Sources']) await expect(page.getByRole('heading', { name: h, exact: true })).toBeVisible();
  await expect(page.getByText(/By INRGIFT Research · Not separately reviewed/)).toBeVisible();
  await expect(page.getByText('Disclosure.')).toBeVisible();
  await page.goto('/research/countries');
  await expect(page.getByRole('heading', { name: 'Country research' })).toBeVisible();
  await page.goto('/stocks/TSM');
  const identity = page.getByRole('region', { name: /Issuer, securities and listings/ }).or(page.locator('section', { hasText: 'Issuer, securities and listings' })).first();
  await expect(identity).toContainText('1 ADR = 5 ordinary shares');
  await expect(identity).toContainText('XTAI');
  await page.goto('/discover/heatmap');
  await expect(page.getByRole('heading', { name: 'How to read this heatmap' })).toBeVisible();
  await page.getByRole('group', { name: 'Colour metric' }).getByRole('button', { name: 'Volatility' }).click();
  await expect(page.getByText('Period: annualised 30-day volatility')).toBeVisible();
});
