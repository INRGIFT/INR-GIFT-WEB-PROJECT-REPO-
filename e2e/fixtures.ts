import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';

/**
 * A fully verified demo session (demo builds only: NEXT_PUBLIC_AUTH_MODE=demo). Same shape the demo adapter writes
 * after sign-up, email link, phone verification and an SMS code (src/features/auth/auth-service.ts), so tests that
 * need a signed-in visitor do not repeat the whole journey. Production sessions come from Supabase, never from this.
 */
/** Mirrors the build's SMS second-factor switch (src/lib/config.ts); run the suite with the same env as the build. */
export const SMS_ON = process.env.NEXT_PUBLIC_SMS_SECOND_FACTOR === 'on';
export const DEMO_EMAIL = 'analyst@example.com';
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
