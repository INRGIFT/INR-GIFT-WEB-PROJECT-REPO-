import { createHash } from 'node:crypto';
import { expect, type Page } from '@playwright/test';

/**
 * A fully verified demo session (demo builds only: NEXT_PUBLIC_AUTH_MODE=demo). Same shape the demo adapter writes
 * after sign-up, email link, phone verification and an SMS code (src/features/auth/auth-service.ts), so tests that
 * need a signed-in visitor do not repeat the whole journey. Production sessions come from Supabase, never from this.
 */
/** Mirrors the build's SMS second-factor switch (src/lib/config.ts); run the suite with the same env as the build. */
export const SMS_ON = process.env.NEXT_PUBLIC_SMS_SECOND_FACTOR === 'on';
export const DEMO_EMAIL = 'analyst@example.com';
/** Demo builds accept 123456 for every email and SMS code (src/features/auth/auth-service.ts). */
export const DEMO_CODE = '123456';
/** Sign-up step 2: enter the six-digit email code; ends on step 3. */
export async function verifyEmailCode(page: Page, code = DEMO_CODE) {
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();
  await expect(page.getByText('Step 2 of 3 · Verify email')).toBeVisible();
  await page.getByLabel('Email verification code').fill(code);
  await page.getByRole('button', { name: 'Verify email' }).click();
}
/**
 * Sign-up step 3 after a correct code. With the password in memory the sign-in is automatic; then the mobile-number
 * step: the SMS code when the SMS second factor is on, otherwise a confirmation of the saved number. Ends on onboarding.
 */
export async function finishSignup(page: Page, opts: { password?: string } = {}) {
  if (opts.password) {
    await expect(page.getByRole('heading', { name: 'Sign in to finish' })).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill(opts.password);
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  if (SMS_ON) {
    await expect(page.getByRole('heading', { name: 'Verify your mobile number' })).toBeVisible();
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('SMS code').fill(DEMO_CODE);
    await page.getByRole('button', { name: 'Verify number' }).click();
  } else {
    await expect(page.getByRole('heading', { name: 'Your mobile number' })).toBeVisible();
    await expect(page.getByText('Step 3 of 3 · Mobile number')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  await expect(page.getByRole('heading', { name: 'How should prices appear?' })).toBeVisible();
}
/** The account-ready confirmation at the end of onboarding: GIFT ID shown, then Continue to INRGIFT. */
export async function continueToInrgift(page: Page) {
  await expect(page.getByRole('heading', { name: 'Your INRGIFT account is ready.' })).toBeVisible();
  await expect(page.getByText(/^GIFT-[0-9A-HJKMNP-TV-Z]{8}$/)).toBeVisible();
  await page.getByRole('button', { name: 'Continue to INRGIFT' }).click();
}
/** Skips the onboarding steps and continues past the account-ready confirmation. */
export async function skipOnboarding(page: Page) {
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await continueToInrgift(page);
}
export const DEMO_PASSWORD = 'research-2026!';
const hash = (pw: string) => createHash('sha256').update(`inrgift-demo:${pw}`).digest('hex');
export function demoState(opts: { smsVerified?: boolean; signedIn?: boolean } = {}) {
  return {
    accounts: [{ id: 'demo-e2e', email: DEMO_EMAIL, signupPhone: '+919876543210', phone: '+919876543210', name: 'E2E Analyst', pw: hash(DEMO_PASSWORD), emailVerified: true }],
    session: opts.signedIn === false ? null : { accountId: 'demo-e2e', amr: ['password'], smsVerified: opts.smsVerified ?? true, lastSmsAt: 0 },
    challenge: null, recoveryFor: null, lastSignup: null, events: [],
  };
}
export async function signInDemo(page: Page, opts: { smsVerified?: boolean; signedIn?: boolean } = {}) {
  const state = demoState(opts);
  const ok = opts.signedIn !== false && (opts.smsVerified ?? true);
  await page.addInitScript((s) => { try { if (!sessionStorage.getItem('e2e.seeded')) { localStorage.setItem('inrgift.demo.auth.v3', s); sessionStorage.setItem('e2e.seeded', '1'); } } catch { /* ignore */ } }, JSON.stringify(state));
  const url = new URL(process.env.E2E_BASE_URL ?? 'http://localhost:3000');
  if (ok) await page.context().addCookies([{ name: 'inrgift_demo_session', value: '1', domain: url.hostname, path: '/', sameSite: 'Lax' }]);
}
