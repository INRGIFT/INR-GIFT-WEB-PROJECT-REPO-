import { expect, test, type Page } from '@playwright/test';

/**
 * Required credentials: email + phone + password, with the SMS code as the second factor at every sign-in.
 * Runs against a demo build (NEXT_PUBLIC_AUTH_MODE=demo): accounts live in the browser, the email link is a button and
 * every SMS code is 123456. The rules are the shared ones in src/features/auth/policy.ts; Supabase enforces the same
 * rules in production (middleware + RLS, verified by `npm run test:db`). Numbers refer to the required test cases.
 */
const CODE = '123456';
const PASSWORD = 'research-2026!';
const A = { email: 'asha@example.com', phone: '+91 98765 43210' };

async function fillSignup(page: Page, v: { email: string; phone: string; password?: string; confirm?: string }) {
  await page.goto('/signup');
  await page.getByLabel('Full name').fill('Asha Rao');
  await page.getByLabel('Email', { exact: true }).fill(v.email);
  await page.getByLabel('Mobile number').fill(v.phone);
  await page.getByLabel('Password', { exact: true }).fill(v.password ?? PASSWORD);
  await page.getByLabel('Confirm password').fill(v.confirm ?? v.password ?? PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
}
async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
async function openEmailLink(page: Page) {
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await page.getByRole('button', { name: /Open the verification link/ }).click();
  await expect(page.getByText('Email verified. Sign in with your email and password')).toBeVisible();
}
async function enterSms(page: Page, code: string, button: RegExp | string) {
  await page.getByLabel('SMS code').fill(code);
  await page.getByRole('button', { name: button }).click();
}
/** Sign up and verify email and phone; ends on onboarding with an activated account. */
async function activate(page: Page, v = A) {
  await fillSignup(page, v);
  await openEmailLink(page);
  await signIn(page, v.email);
  await expect(page.getByRole('heading', { name: 'Verify your mobile number' })).toBeVisible();
  await page.getByRole('button', { name: 'Send code' }).click();
  await enterSms(page, CODE, 'Verify number');
  await expect(page.getByRole('heading', { name: 'How should prices appear?' })).toBeVisible();
}
async function signOut(page: Page) {
  await page.goto('/account/security');
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await expect(page).toHaveURL(/\/$/);
}

test('sign-up requires email, phone, password and confirmation (cases 2–5)', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Mobile number').fill('');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Enter your email address.')).toBeVisible();
  await expect(page.getByText('Enter your mobile number.')).toBeVisible();
  await expect(page.getByText('Enter a password.')).toBeVisible();
  await page.getByLabel('Mobile number').fill('98765 43210');
  await page.getByLabel('Password', { exact: true }).fill('weakpass');
  await page.getByLabel('Confirm password').fill('different');
  await expect(page.getByText(/with its country code/)).toBeVisible();
  await expect(page.getByText('Use at least 10 characters.')).toBeVisible();
  await expect(page.getByText('The two passwords do not match.')).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test('email + phone + password signs up and activates; duplicates are rejected (cases 1, 6, 7, 8)', async ({ page }) => {
  await activate(page);
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/account/security');
  await expect(page.getByText('Code sent to your phone at every sign-in')).toBeVisible();
  await expect(page.getByText('Enabled')).toBeVisible();
  await expect(page.getByRole('button', { name: /Turn off/ })).toHaveCount(0);
  await signOut(page);
  await fillSignup(page, { email: A.email, phone: '+91 91234 56789' });
  await expect(page.getByText('An account already uses that email address')).toBeVisible();
  await fillSignup(page, { email: 'other@example.com', phone: A.phone });
  await expect(page.getByText('An account already uses that mobile number')).toBeVisible();
});

test('unverified email or phone keeps the workspace closed (cases 9, 10, 12)', async ({ page }) => {
  await fillSignup(page, A);
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
  await signIn(page, A.email);
  await expect(page.getByText('Verify your email address first')).toBeVisible();
  await page.goto(`/verify?email=${encodeURIComponent(A.email)}`);
  await openEmailLink(page);
  await signIn(page, A.email);
  await expect(page.getByRole('heading', { name: 'Verify your mobile number' })).toBeVisible();
  await expect(page.getByText(/Skip/)).toHaveCount(0);
  for (const path of ['/app', '/app/watchlist', '/account/security']) {
    await page.goto(path);
    await expect(page).not.toHaveURL(new RegExp(`${path}$`));
  }
});

test('wrong SMS code blocks; correct code opens; sign-out requires all three again (cases 11, 13, 14)', async ({ page }) => {
  await activate(page);
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await signOut(page);
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
  await signIn(page, A.email, 'wrong-password-1!');
  await expect(page.getByText('Those details do not match')).toBeVisible();
  await signIn(page, A.email);
  await expect(page.getByRole('heading', { name: 'Enter the code sent to your phone' })).toBeVisible();
  await enterSms(page, '000000', 'Verify and continue');
  await expect(page.getByText('That code is not right')).toBeVisible();
  await page.goto('/app');
  // Still at the SMS step: the workspace stays closed, and the code already sent can still be entered.
  await expect(page).toHaveURL(/\/verify-phone/);
  await enterSms(page, CODE, 'Verify and continue');
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test('password reset needs the SMS code and does not bypass it at the next sign-in (case 15)', async ({ page }) => {
  await activate(page);
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await signOut(page);
  await page.goto('/forgot-password');
  await page.getByLabel('Email', { exact: true }).fill(A.email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.getByRole('link', { name: /Open the reset link/ }).click();
  await expect(page.getByRole('heading', { name: 'Confirm it is you' })).toBeVisible();
  // The recovery session cannot open the workspace.
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/reset-password');
  await page.getByRole('button', { name: 'Send code to my phone' }).click();
  await enterSms(page, CODE, 'Verify');
  await page.getByLabel('New password', { exact: true }).fill('a-new-password-9!');
  await page.getByLabel('Confirm new password').fill('a-new-password-9!');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByText('Password changed and other sessions signed out')).toBeVisible();
  await signIn(page, A.email);
  await expect(page.getByText('Those details do not match')).toBeVisible();
  await signIn(page, A.email, 'a-new-password-9!');
  await expect(page.getByRole('heading', { name: 'Enter the code sent to your phone' })).toBeVisible();
  await page.goto('/app');
  await expect(page).toHaveURL(/\/verify-phone/);
  await enterSms(page, CODE, 'Verify and continue');
  await expect(page).toHaveURL(/\/app$/);
});

test('changing the phone number needs the current SMS session and verification of the new number', async ({ page }) => {
  await activate(page);
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await page.goto('/account/security');
  await page.getByRole('link', { name: 'Change number' }).click();
  await expect(page.getByRole('heading', { name: 'Change your mobile number' })).toBeVisible();
  await page.getByLabel('Mobile number').fill('+91 91234 56789');
  await page.getByRole('button', { name: 'Send code' }).click();
  await enterSms(page, '111111', 'Verify number');
  await expect(page.getByText('That code is not right')).toBeVisible();
  await enterSms(page, CODE, 'Verify number');
  await expect(page).toHaveURL(/\/account\/security$/);
  await expect(page.getByText('+91 ••••• 789')).toBeVisible();
});

test('after sign-in the visitor lands on the page they asked for, query included (case L)', async ({ page }) => {
  await activate(page);
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await signOut(page);
  await page.goto('/discover/screener?region=Europe');
  await expect(page).toHaveURL(/\/login\?next=%2Fdiscover%2Fscreener%3Fregion%3DEurope/);
  await signIn(page, A.email);
  await expect(page.getByRole('heading', { name: 'Enter the code sent to your phone' })).toBeVisible();
  await enterSms(page, CODE, 'Verify and continue');
  // The screener lands with the filter applied, then rewrites it into its own encoded form (q=…).
  await expect(page).toHaveURL(/\/discover\/screener\?/);
  const hasEurope = () => { const u = new URL(page.url()); const q = u.searchParams.get('q'); return u.searchParams.get('region') === 'Europe' || (q !== null && Buffer.from(q, 'base64url').toString().includes('"Europe"')); };
  await expect.poll(hasEurope, { timeout: 10_000 }).toBe(true);
});

test('sign-up keeps the original destination through email and phone verification', async ({ page }) => {
  await page.goto('/research/stocks');
  await expect(page).toHaveURL(/\/login\?next=%2Fresearch%2Fstocks/);
  await page.getByRole('link', { name: 'Create your account' }).click();
  await expect(page).toHaveURL(/\/signup\?next=%2Fresearch%2Fstocks/);
  await page.getByLabel('Full name').fill('Asha Rao');
  await page.getByLabel('Email', { exact: true }).fill(A.email);
  await page.getByLabel('Mobile number').fill(A.phone);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await openEmailLink(page);
  await signIn(page, A.email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await enterSms(page, CODE, 'Verify number');
  await expect(page.getByRole('heading', { name: 'How should prices appear?' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await expect(page).toHaveURL(/\/research\/stocks$/);
});

test('malicious return URLs are ignored (case M)', async ({ page }) => {
  await activate(page);
  await page.getByRole('button', { name: 'Skip setup' }).click();
  for (const evil of ['https://external-site.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)']) {
    await signOut(page);
    await page.goto(`/login?next=${encodeURIComponent(evil)}`);
    await signIn(page, A.email);
    await enterSms(page, CODE, 'Verify and continue');
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/app$/);
  }
});
