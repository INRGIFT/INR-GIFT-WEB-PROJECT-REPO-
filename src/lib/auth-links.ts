import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Where an emailed auth link lands after Supabase verifies it.
 * - Sign-up / email confirmation: the email is now verified, but that link is not the password. The session it
 *   opened is closed and the person signs in with email + password, then verifies the phone (src/features/auth/policy.ts).
 * - Recovery: a recovery session that can only reach /reset-password, which asks for the SMS code first.
 * A `next` return path is kept only if it is an internal path (src/lib/return-url.ts) and only after sign-in.
 */
export type LinkKind = 'signup' | 'recovery';
export const linkKind = (type: EmailOtpType | string | null): LinkKind | null =>
  type === 'recovery' ? 'recovery' : type === 'signup' || type === 'email' || type === 'email_change' ? 'signup' : null;
import { safeReturnPath } from './return-url';
/** `next` (validated with safeReturnPath) is carried to sign-in, so the person lands where they were going. */
export const landing = (kind: LinkKind, next?: string | null) => {
  const dest = safeReturnPath(next, '');
  return kind === 'recovery' ? '/reset-password' : `/login?notice=verified${dest ? `&next=${encodeURIComponent(dest)}` : ''}`;
};
