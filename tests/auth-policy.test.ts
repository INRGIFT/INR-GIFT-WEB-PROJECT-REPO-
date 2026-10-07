import { describe, expect, it } from 'vitest';
import { amrMethods, validateSignup, workspaceGate, type AuthFacts } from '@/features/auth/policy';
import { landing, linkKind } from '@/lib/auth-links';

const full: AuthFacts = { signedIn: true, emailConfirmed: true, phoneVerified: true, passwordSession: true, smsVerified: true };
const good = { name: 'Asha Rao', email: 'asha@example.com', phone: '+91 98765 43210', password: 'research-2026!', confirm: 'research-2026!', terms: true };

describe('sign-up requires email, phone and password', () => {
  it('1. email + phone + strong password is accepted', () => expect(validateSignup(good)).toEqual({}));
  it('2. missing email is rejected', () => expect(validateSignup({ ...good, email: ' ' }).email).toBeTruthy());
  it('3. missing phone is rejected (country code alone counts as missing)', () => {
    expect(validateSignup({ ...good, phone: '' }).phone).toBeTruthy();
    expect(validateSignup({ ...good, phone: '+91 ' }).phone).toBe('Enter your mobile number.');
  });
  it('3b. a number without country code is not E.164', () => expect(validateSignup({ ...good, phone: '98765 43210' }).phone).toMatch(/country code/));
  it('4. missing password is rejected', () => expect(validateSignup({ ...good, password: '', confirm: '' }).password).toBe('Enter a password.'));
  it('5. weak passwords are rejected', () => { for (const pw of ['short1!', 'no-digits-here!', 'nosymbols123']) expect(validateSignup({ ...good, password: pw, confirm: pw }).password).toBeTruthy(); });
  it('rejects a confirmation that does not match', () => expect(validateSignup({ ...good, confirm: 'research-2026?' }).confirm).toMatch(/do not match/));
  it('invalid email format is rejected', () => expect(validateSignup({ ...good, email: 'asha@' }).email).toBeTruthy());
});

describe('SMS second factor switched off (2Factor.in / DLT pending)', () => {
  const off = (f: Partial<AuthFacts>) => workspaceGate({ ...full, phoneVerified: false, smsVerified: false, ...f }, false);
  it('email + password with a confirmed email opens the workspace without any SMS', () => expect(off({})).toBe('ok'));
  it('still requires a confirmed email and a password session', () => {
    expect(off({ emailConfirmed: false })).toBe('verify-email');
    expect(off({ passwordSession: false })).toBe('login');
    expect(off({ signedIn: false })).toBe('login');
  });
});

describe('workspace gate (middleware, RLS and demo all apply this rule)', () => {
  it('13. email + password + verified phone + SMS this session opens the workspace', () => expect(workspaceGate(full, true)).toBe('ok'));
  it('signed out goes to sign in', () => expect(workspaceGate({ ...full, signedIn: false }, true)).toBe('login'));
  it('9. unverified email is blocked', () => expect(workspaceGate({ ...full, emailConfirmed: false }, true)).toBe('verify-email'));
  it('10/12. unverified phone is blocked, even with a correct password', () => expect(workspaceGate({ ...full, phoneVerified: false, smsVerified: false }, true)).toBe('verify-phone'));
  it('11. correct password but no (or a wrong) SMS code is blocked', () => expect(workspaceGate({ ...full, smsVerified: false }, true)).toBe('sms'));
  it('phone + SMS without the password is blocked', () => expect(workspaceGate({ ...full, passwordSession: false }, true)).toBe('login'));
  it('15. a password-reset (recovery) session never opens the workspace, even after SMS', () => expect(workspaceGate({ ...full, passwordSession: false, smsVerified: true }, true)).toBe('login'));
  it('14. a fresh sign-in after sign-out needs the SMS code again', () => expect(workspaceGate({ ...full, smsVerified: false }, true)).toBe('sms'));
  it('reads Supabase amr objects and RFC 8176 strings', () => {
    expect(amrMethods([{ method: 'password', timestamp: 1 }])).toEqual(['password']);
    expect(amrMethods(['password'])).toEqual(['password']);
    expect(amrMethods(undefined)).toEqual([]);
  });
});

describe('email links', () => {
  it('a confirmation link lands on sign-in, never in the workspace', () => { expect(linkKind('email')).toBe('signup'); expect(landing('signup')).toMatch(/^\/login\?notice=verified/); });
  it('a recovery link lands only on the reset page', () => { expect(linkKind('recovery')).toBe('recovery'); expect(landing('recovery')).toBe('/reset-password'); });
  it('magic links and unknown types are refused', () => { expect(linkKind('magiclink')).toBeNull(); expect(linkKind('nope')).toBeNull(); });
});
