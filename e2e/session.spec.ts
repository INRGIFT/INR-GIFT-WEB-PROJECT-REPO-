import { expect, test } from '@playwright/test';
import { signInDemo } from './fixtures';

/**
 * Session lifecycle in the browser (demo build; Supabase builds follow the same context logic and its own tab sync).
 * Server-side enforcement (middleware 401/redirect, no-store) is covered in quality.spec.ts and tests/middleware.test.ts.
 */
test('logout in one tab ends the session in the other; back button and protected APIs need sign-in again', async ({ page, context }) => {
  await signInDemo(page);
  await page.goto('/');
  await page.goto('/app/watchlist');
  await expect(page).toHaveURL(/\/app\/watchlist$/);
  const other = await context.newPage();
  await other.goto('/account/security');
  await other.getByRole('button', { name: 'Sign out' }).first().click();
  await expect(other).toHaveURL(/\/$/);
  // The first tab notices and leaves the protected page for sign-in, keeping where it was.
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fwatchlist$/, { timeout: 10_000 });
  // The protected page was replaced in history; Back goes to the page before it, never to cached protected content.
  await page.goBack();
  await expect(page).not.toHaveURL(/\/app\/watchlist$/);
  // Opening it again is a fresh, redirected request.
  await page.goto('/app/watchlist');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fwatchlist$/);
  const api = await page.request.get('/api/v1/assets');
  expect(api.status()).toBe(401);
  // No auth secrets in browser storage.
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(stored).not.toMatch(/access_token|refresh_token|"pw"\s*:\s*"[^"]{0,20}"|123456/);
});
