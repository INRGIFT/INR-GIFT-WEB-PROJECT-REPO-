/**
 * The signed-in person's own account as the server reads it (GET /api/v1/me). `giftId` is the permanent INRGIFT
 * account reference (GIFT-XXXXXXXX): shown and copied, never used to authenticate or authorise anything. Only real
 * values: a field is null when the source does not have it. Never a password, token, code or key.
 */
export interface AccountProfile {
  giftId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  /** Sign-in methods on the account: "email" (password), "google". */
  providers: string[];
  /** A password exists (signed up with one, or added after a first Google sign-in). */
  passwordSet: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  /** This session, from its verified token: how it was opened and when; when the current access token expires. */
  session: { method: 'password' | 'oauth' | 'other'; startedAt: string | null; tokenExpiresAt: string | null } | null;
}
/** GIFT- followed by 8 Crockford base32 characters (no I, L, O, U). Format check only: it proves nothing about ownership. */
export const GIFT_ID_PATTERN = /^GIFT-[0-9A-HJKMNP-TV-Z]{8}$/;
export const normalizeGiftId = (v: string) => v.trim().toUpperCase();
