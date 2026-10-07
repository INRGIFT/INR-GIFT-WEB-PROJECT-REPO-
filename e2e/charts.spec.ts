import { expect, test, type Page } from '@playwright/test';
import { signInDemo } from './fixtures';

/** KLineChart financial charts: public/private boundary, rendering, controls, states and notices (demo builds). */
const chart = (page: Page) => page.getByRole('region', { name: /chart$/ }).first();

test('signed out: the chart API needs sign-in; licence texts and the notices page are public', async ({ page, request }) => {
  expect((await request.get('/api/v1/assets/AAPL/chart?range=1Y')).status()).toBe(401);
  const notice = await request.get('/licenses/klinecharts/NOTICE.txt');
  expect(notice.status()).toBe(200);
  expect(await notice.text()).toContain('KLineChart');
  expect((await request.get('/licenses/klinecharts/LICENSE.txt')).status()).toBe(200);
  await page.goto('/legal/open-source');
  await expect(page.getByRole('heading', { level: 1, name: 'Open-Source Software Notices' })).toBeVisible();
  await expect(page.getByText('Copyright (c) 2019 lihu').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Apache License, Version 2.0 (KLineChart)' })).toHaveAttribute('href', '/licenses/klinecharts/LICENSE.txt');
  await page.goto('/stocks/AAPL');
  await expect(page).toHaveURL(/\/login\?next=%2Fstocks%2FAAPL/);
});

test('asset chart: draws with KLineChart, shows status, session, source and native currency, never "Live" for demo data', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/stocks/AAPL');
  const c = chart(page);
  await expect(c.locator('canvas').first()).toBeVisible();
  await expect(c.getByText(/^◇?Demo data$/).first()).toBeVisible();
  await expect(c.getByText(/As of .*\d{2}:\d{2}/)).toBeVisible();
  await expect(c.getByText('Source: demo-provider')).toBeVisible();
  await expect(c.getByText('Prices in USD (as quoted, not converted)')).toBeVisible();
  await expect(c.getByText('Times: America/New_York')).toBeVisible();
  await expect(c.getByText(/^Live$/)).toHaveCount(0);
  // Range and interval: 5D → 30-minute bars; the legend and footer follow.
  await c.getByRole('group', { name: 'Time range' }).getByRole('button', { name: '5D' }).click();
  await expect(c.getByText(/\d+ bars · 30 minutes/)).toBeVisible();
  await expect(c.getByRole('combobox', { name: /Interval/ })).toHaveValue('30m');
  // Indicators: RSI adds a pane; MACD is the standard one.
  await c.getByRole('button', { name: /Indicators/ }).click();
  await c.getByRole('checkbox', { name: /Relative strength index/ }).check();
  await c.getByRole('checkbox', { name: /MACD/ }).check();
  await page.keyboard.press('Escape');
  await expect(c.getByRole('button', { name: /Indicators/ })).toContainText('3');
  // Keyboard crosshair reads bars out.
  await c.getByRole('group', { name: /Arrow keys move between bars/ }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(c.locator('p[aria-live="polite"]')).toContainText(/open .* close/);
  // Drawing tools exist and arm a tool.
  await c.getByRole('button', { name: 'Draw' }).click();
  await page.getByRole('button', { name: 'Trend line' }).click();
  await expect(c.getByText(/Drawing: click points on the chart/)).toBeVisible();
});

test('API: unsupported intervals are refused with the alternatives; the contract carries provenance', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/app');
  const bad = await page.request.get('/api/v1/assets/AAPL/chart?range=1Y&resolution=5m');
  expect(bad.status()).toBe(400);
  expect((await bad.json()).error).toMatchObject({ code: 'UNSUPPORTED_RESOLUTION', supported: ['1D', '1W', '1M'] });
  const good = await (await page.request.get('/api/v1/assets/AAPL/chart?range=1Y')).json();
  expect(good.data).toMatchObject({ currency: 'USD', timezone: 'America/New_York', status: 'DEMO', realtime: false });
  expect(good.data.instrumentId).toMatch(/^ins_\d{6}$/);
  expect(JSON.stringify(good)).not.toMatch(/api_?key|secret|token/i);
});

test('closed market and provider failure: the chart says so instead of inventing data', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/app');
  const markets = (await (await page.request.get('/api/v1/markets')).json()).data as { id: string; session: string }[];
  const assets = (await (await page.request.get('/api/v1/indices?pageSize=100')).json()).data as { slug: string; marketId: string }[];
  const closed = assets.find((a) => ['CLOSED', 'HOLIDAY'].includes(markets.find((m) => m.id === a.marketId)?.session ?? ''));
  test.skip(!closed, 'every market with an index is open right now');
  await page.goto(`/indices/${closed!.slug}`);
  await expect(chart(page).getByText(/Market (closed|holiday)/)).toBeVisible();
  await expect(chart(page).locator('canvas').first()).toBeVisible();
  await page.goto('/commodities/NATGAS');
  await expect(page.getByText('The chart could not load')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('compare: one chart with change-from-start lines for every asset', async ({ page }) => {
  await signInDemo(page);
  await page.goto('/discover/compare?s=AAPL,MSFT,NVDA');
  const c = chart(page);
  await expect(c.locator('canvas').first()).toBeVisible();
  const lines = c.getByRole('list', { name: 'Lines' });
  for (const s of ['AAPL', 'MSFT', 'NVDA']) await expect(lines.getByText(s, { exact: true })).toBeVisible();
  await expect(c.getByText('Change from the start of the period, %').first()).toBeVisible();
});
