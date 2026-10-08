import { expect, test, type Page } from '@playwright/test';
import { skipOnboarding, SMS_ON } from './fixtures';

/**
 * Compliance pages (public), their forms, and Google sign-in. Runs on a demo build: "Continue with Google" is simulated
 * in the browser (production uses Supabase OAuth, covered by unit tests of the callback route), and Resend is not
 * configured, so forms must report that honestly instead of claiming success.
 */
const PASSWORD = 'research-2026!';

test('compliance pages are public, carry the company details and show no phone number unless configured', async ({ page }) => {
  for (const [path, heading] of [['/terms-and-conditions', 'Terms and Conditions'], ['/privacy-policy', 'Privacy Policy'], ['/about', 'About INRGIFT'], ['/support', 'Support'], ['/grievance-redressal', 'Grievance Redressal'], ['/legal', 'Legal'], ['/legal/risk-disclaimer', 'Risk and Research Disclaimer'], ['/legal/cookie-policy', 'Cookie and Tracking Notice']]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { level: 1, name: heading }), path).toBeVisible();
  }
  await page.goto('/support');
  const main = page.locator('main');
  await expect(main.getByRole('link', { name: 'support@inrgift.com' }).first()).toBeVisible();
  await expect(main.getByText('904 WHITE ORCHID').first()).toBeVisible();
  await expect(main.getByText('Surat, Gujarat 395009').first()).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  const footer = page.locator('footer');
  for (const l of ['About', 'Support', 'Terms and Conditions', 'Privacy Policy', 'Risk Disclaimer', 'Grievance Redressal', 'Account Closure']) await expect(footer.getByRole('link', { name: l, exact: true }), l).toBeVisible();
  await expect(footer.getByText('Invest Beyond Borders', { exact: true })).toBeVisible();
});

test('account closure: required NSEIXGA text, validation, and an honest result when email delivery is unavailable', async ({ page }) => {
  await page.goto('/account-closure');
  await expect(page.getByRole('heading', { level: 1, name: 'How to Close My Global Trading Account' })).toBeVisible();
  await expect(page.getByText('You can close your Global trading account by sending us an email request from your registered email address to support@inrgift.com. The closure process takes 2 working days once you submit your request.')).toBeVisible();
  for (const item of ['Cleared any negative balance in the account', 'Sold off any holdings in the account', 'Withdrawn any cash balance from the account', 'Downloaded all necessary reports (trade confirms, ledger, and P&L statements), as these will not be accessible once the account is closed', 'If the customer wishes to move securities to another broker, transferred shares and cash prior to requesting account closure'])
    await expect(page.getByText(item, { exact: true })).toBeVisible();
  await expect(page.getByText(/irrevocably agrees that residual amounts including, but not limited to, dividends, corporate action proceeds, or other entitlements arising from prior holdings and received post-closure will not be credited to the client account\. Such amounts may be forfeited, and no claims shall lie against the Company in respect of the same\./)).toBeVisible();

  await page.getByRole('button', { name: 'Submit closure request' }).click();
  await expect(page.getByText('Enter your email address.')).toBeVisible();
  await expect(page.getByText('Confirm that this is your registered email address.')).toBeVisible();
  await expect(page.getByText('Confirm that you agree to the residual amounts statement.')).toBeVisible();

  await page.getByRole('textbox', { name: 'Registered email' }).fill('asha@example.com');
  await page.getByLabel('Full name').fill('Asha Rao');
  await page.getByText('I confirm that I am submitting this request from my registered email address.').click();
  await page.getByText('I have completed the checklist above before requesting closure.').click();
  await page.getByText(/I have read and irrevocably agree to the statement above/).click();
  await page.getByText(/I understand that this submits a request/).click();
  await page.waitForTimeout(1300); // the server drops forms filled faster than a person could
  await page.getByRole('button', { name: 'Submit closure request' }).click();
  // No Resend key in this build: the server refuses honestly and the page never claims the request was submitted.
  await expect(page.getByRole('alert').filter({ hasText: 'cannot be sent right now' })).toBeVisible();
  await expect(page.getByText('Your account closure request has been submitted.')).toHaveCount(0);
});

test('grievance and support forms validate before sending', async ({ page }) => {
  await page.goto('/grievance-redressal');
  await page.getByRole('button', { name: 'Submit grievance' }).click();
  for (const t of ['Enter your full name.', 'Enter your phone number.', 'Choose a category.', 'Describe your grievance.', 'Tick the box to confirm.']) await expect(page.getByText(t)).toBeVisible();
  await page.goto('/support?topic=privacy');
  await expect(page.getByLabel('Category')).toHaveValue('privacy');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByRole('button', { name: 'Send to support' }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
});

async function completeGoogleProfile(page: Page) {
  await expect(page.getByRole('heading', { name: 'Complete your INRGIFT profile' })).toBeVisible();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByText('Accept the Terms and Conditions and the Privacy Policy to continue.')).toBeVisible();
  await page.getByLabel('Mobile number').fill('+91 91234 56780');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  if (SMS_ON) {
    await expect(page.getByRole('heading', { name: 'Verify your mobile number' })).toBeVisible();
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('SMS code').fill('123456');
    await page.getByRole('button', { name: 'Verify number' }).click();
  }
  await expect(page.getByRole('heading', { name: 'How should prices appear?' })).toBeVisible();
}

test('Google: first sign-in completes phone, password, country and terms before anything opens; then email + password also works', async ({ page }) => {
  await page.goto('/research/stocks');
  await expect(page).toHaveURL(/\/login\?next=%2Fresearch%2Fstocks/);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/complete-profile\?next=%2Fresearch%2Fstocks/);
  // The workspace stays closed until the profile is complete.
  await page.goto('/app');
  await expect(page).not.toHaveURL(/\/app$/);
  await page.goto('/complete-profile?next=%2Fresearch%2Fstocks');
  await completeGoogleProfile(page);
  await skipOnboarding(page);
  await expect(page).toHaveURL(/\/research\/stocks$/);
  // Sign out, then sign in with the email and the password set above.
  await page.goto('/account/security');
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('google.user@example.com');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  if (SMS_ON) { await page.getByLabel('SMS code').fill('123456'); await page.getByRole('button', { name: 'Verify and continue' }).click(); }
  await expect(page).toHaveURL(/\/app$/);
});

test('Apple: a relay address and no name; the profile asks for the name before anything opens', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByText('Or continue with email')).toBeVisible();
  await page.getByRole('button', { name: 'Continue with Apple' }).click();
  await expect(page).toHaveURL(/\/complete-profile/);
  await expect(page.getByRole('heading', { name: 'Complete your INRGIFT profile' })).toBeVisible();
  await expect(page.getByText(/Apple private relay address/)).toBeVisible();
  await expect(page.getByLabel('Full name')).toHaveValue('');
  await page.goto('/app');
  await expect(page).not.toHaveURL(/\/app$/);
  await page.goto('/complete-profile');
  await page.getByLabel('Mobile number').fill('+91 91234 56781');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByText('Enter your name.')).toBeVisible();
  await page.getByLabel('Full name').fill('Riya Mehta');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  if (SMS_ON) {
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('SMS code').fill('123456');
    await page.getByRole('button', { name: 'Verify number' }).click();
  }
  await expect(page.getByRole('heading', { name: 'How should prices appear?' })).toBeVisible();
});

test('Google: a failed or cancelled sign-in returns to the login page with a message and a safe destination', async ({ page }) => {
  await page.goto('/auth/callback?flow=oauth&error=access_denied&next=%2Fmarkets');
  await expect(page).toHaveURL(/\/login\?error=oauth&next=%2Fmarkets$/);
  await expect(page.getByText('Sign-in with Google or Apple did not complete.')).toBeVisible();
  await page.goto('/auth/callback?flow=oauth&provider=apple&error=access_denied');
  await expect(page).toHaveURL(/\/login\?error=oauth&provider=apple$/);
  await expect(page.getByText('Apple sign-in did not complete.')).toBeVisible();
  await page.goto('/auth/callback?flow=oauth&error=access_denied&next=https%3A%2F%2Fevil.example');
  await expect(page).toHaveURL(/\/login\?error=oauth$/);
});
