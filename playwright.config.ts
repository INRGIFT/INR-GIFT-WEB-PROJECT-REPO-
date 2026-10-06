import { defineConfig, devices } from '@playwright/test';

/**
 * E2E against a production build. Set E2E_BASE_URL to test an already-running server (no webServer is started),
 * and PW_CHROMIUM_PATH to use a preinstalled Chromium instead of Playwright's download.
 */
const external = process.env.E2E_BASE_URL;
const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: external ?? 'http://localhost:3000', trace: 'retain-on-failure', launchOptions },
  webServer: external ? undefined : { command: 'npm run build && npm run start', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions } },
  ],
});
