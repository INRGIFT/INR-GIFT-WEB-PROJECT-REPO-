import { AUTH_PAGES } from './route-registry';

const BASE = 'https://inrgift.invalid';
/**
 * The one return-URL rule for INRGIFT (`?next=` on sign-in, sign-up and verification).
 * Accepts only an internal path, keeping its query string and hash: "/markets/US", "/discover/screener?market=us".
 * Rejects anything that could leave the site or loop: absolute URLs, protocol-relative ("//evil.com"), backslash
 * tricks ("/\\evil.com"), "javascript:", control characters, over-long values, and the auth pages themselves.
 */
export function safeReturnPath(raw: string | null | undefined, fallback = '/app'): string {
  if (!raw || typeof raw !== 'string' || raw.length > 2048) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  let u: URL;
  try { u = new URL(raw, BASE); } catch { return fallback; }
  if (u.origin !== BASE || !u.pathname.startsWith('/')) return fallback;
  if (AUTH_PAGES.some((p) => u.pathname === p || u.pathname.startsWith(`${p}/`))) return fallback;
  return `${u.pathname}${u.search}${u.hash}`;
}
/** "/login?next=…" for a destination (path + query), URL-encoded. */
export const loginHref = (dest: string) => `/login?next=${encodeURIComponent(safeReturnPath(dest))}`;
