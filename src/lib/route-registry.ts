/**
 * Route registry and access policy. Middleware, robots.txt, the sitemap and the tests all read this file, so a route's
 * rules live in one place.
 *
 * ACCESS POLICY (default deny):
 *   public      "/" and the compliance pages (terms, privacy, about, support, account closure, grievance, legal)
 *   auth        sign-in, sign-up and verification infrastructure, open so people can authenticate
 *   public-api  endpoints that must work before sign-in and protect themselves (health, auth steps, signed hooks, ingest)
 *   file        static and metadata files (robots, sitemap, icons, share images, files in /public)
 *   protected   EVERYTHING ELSE, pages and /api alike: requires a fully verified session (src/features/auth/policy.ts)
 * A new route is protected automatically; making something public means adding it here with a reason.
 * A page path that no registered page answers (a typo, an old link) is not a protected page: middleware lets it reach
 * Next.js, which renders the 404 page (isUnknownPage). /api paths are never treated that way: they stay default-deny.
 */
export type Access = 'public' | 'auth' | 'public-api' | 'file' | 'protected';
export type Layout = 'site' | 'workspace' | 'auth' | 'api';
export interface RouteSpec { pattern: string; layout: Layout; access: Access; index: 'index' | 'noindex'; feature: string }

/**
 * Public pages: the homepage and the compliance pages that must be readable without an account (owner decision,
 * 7 Oct 2026, docs/DECISIONS.md): Terms and Conditions, Privacy Policy, About, Support, Account Closure (required by the
 * NSEIXGA white-label documentation), Grievance Redressal and the legal index with its documents. The compliance pages
 * show no market data; the homepage shows only a server-prepared snapshot under the public display policy in
 * src/features/home/snapshot.ts (demo values labelled DEMO), and calls no /api route. Every product, data, workspace
 * and account route stays protected.
 */
export const PUBLIC_PAGES = ['/', '/terms-and-conditions', '/privacy-policy', '/about', '/support', '/account-closure', '/grievance-redressal', '/legal'];
export const AUTH_PAGES = ['/login', '/signup', '/verify', '/verify-phone', '/complete-profile', '/mfa', '/forgot-password', '/reset-password', '/auth/callback', '/auth/confirm'];
/** `/api/forms/*` (support, grievance, account closure) back the public pages: validated, rate-limited, same-origin only. */
export const PUBLIC_API = ['/api/health', '/api/auth', '/api/hooks', '/api/internal', '/api/forms'];
const METADATA_FILES = ['/robots.txt', '/sitemap.xml', '/sitemap', '/manifest.webmanifest', '/icon', '/apple-icon', '/opengraph-image', '/twitter-image', '/favicon.ico'];
/** Files served from /public (brand, fonts, media, posters): marketing assets with no product data. Only root-level
 * files and these folders count, so a page path with a file-like suffix (/stocks/AAPL.png) stays protected.
 * /licenses/ holds third-party licence and notice texts that must be readable by everyone the software reaches. */
const FILE_EXT = /\.(?:svg|png|jpe?g|gif|webp|avif|ico|webm|mp4|vtt|json|woff2?|ttf|otf|css|js|map|txt|xml|webmanifest)$/i;
const FILE_DIRS = /^\/(?:brand|fonts|media|licenses)\/|^\/[^/]+$/;

const under = (p: string, base: string) => (base === '/' ? p === '/' : p === base || p.startsWith(`${base}/`));
/** The access class of a pathname (no query). */
export function classifyPath(pathname: string): Access {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (p.startsWith('/_next/') || METADATA_FILES.some((b) => under(p, b) || p.startsWith(`${b}.`) || p.startsWith(`${b}-`)) || (FILE_EXT.test(p) && FILE_DIRS.test(p))) return 'file';
  if (PUBLIC_PAGES.some((b) => under(p, b))) return 'public';
  if (AUTH_PAGES.some((b) => under(p, b))) return 'auth';
  if (PUBLIC_API.some((b) => under(p, b))) return 'public-api';
  return 'protected';
}
export const isProtectedPath = (p: string) => classifyPath(p) === 'protected';
/** Kept for older call sites: "private" now means protected. */
export const isPrivatePath = isProtectedPath;
/** Only the public pages may be indexed; everything else (and anything with a query) is noindex. */
export const isIndexablePath = (p: string) => classifyPath(p) === 'public';
export const isNoindexPath = (p: string) => !isIndexablePath(p);

const page = (pattern: string, feature: string, layout: Layout = 'site'): RouteSpec => {
  const access = classifyPath(pattern.replace(/\[[^\]]+\]/g, 'x'));
  return { pattern, layout, access, index: access === 'public' ? 'index' : 'noindex', feature };
};
/** Every page in src/app (tests/telemetry.test.ts checks none is missing). Access comes from classifyPath. */
export const ROUTES: RouteSpec[] = [
  page('/', 'home'),
  page('/markets', 'markets', 'workspace'), page('/markets/all', 'markets', 'workspace'), page('/markets/[market]', 'markets', 'workspace'),
  page('/assets', 'assets', 'workspace'), page('/assets/[cls]', 'assets', 'workspace'),
  page('/stocks/[symbol]', 'asset-detail', 'workspace'), page('/etfs/[symbol]', 'asset-detail', 'workspace'), page('/etfs/[symbol]/review', 'etf-review', 'workspace'),
  page('/indices/[index]', 'asset-detail', 'workspace'), page('/fx/[pair]', 'asset-detail', 'workspace'), page('/commodities/[commodity]', 'asset-detail', 'workspace'),
  page('/bonds/[bond]', 'asset-detail', 'workspace'), page('/reits/[reit]', 'asset-detail', 'workspace'),
  page('/discover', 'discover', 'workspace'), page('/discover/heatmap', 'heatmap', 'workspace'), page('/discover/screener', 'screener', 'workspace'), page('/discover/compare', 'compare', 'workspace'),
  page('/discover/collections', 'collections', 'workspace'), page('/discover/collections/[id]', 'collections', 'workspace'), page('/discover/trending', 'trending', 'workspace'),
  page('/research', 'research', 'workspace'), page('/research/[kind]', 'research', 'workspace'), page('/research/[kind]/[slug]', 'research', 'workspace'),
  page('/news', 'news', 'workspace'),
  page('/resources', 'resources', 'workspace'), page('/resources/[kind]', 'resources', 'workspace'), page('/resources/learn/[slug]', 'learn', 'workspace'), page('/resources/glossary/[slug]', 'glossary', 'workspace'),
  page('/search', 'search', 'workspace'),
  page('/about', 'company'), page('/pricing', 'company'), page('/faq', 'company'), page('/support', 'company'),
  page('/terms-and-conditions', 'legal'), page('/privacy-policy', 'legal'), page('/account-closure', 'legal'), page('/grievance-redressal', 'legal'),
  page('/legal', 'legal'), page('/legal/[doc]', 'legal'),
  page('/login', 'auth', 'auth'), page('/signup', 'auth', 'auth'), page('/verify', 'auth', 'auth'), page('/verify-phone', 'auth', 'auth'), page('/complete-profile', 'auth', 'auth'), page('/mfa', 'auth', 'auth'),
  page('/forgot-password', 'auth', 'auth'), page('/reset-password', 'auth', 'auth'),
  page('/onboarding', 'onboarding', 'auth'),
  page('/app', 'workspace', 'workspace'), page('/app/watchlist', 'watchlists', 'workspace'), page('/app/alerts', 'alerts', 'workspace'), page('/app/screens', 'saved-screens', 'workspace'),
  page('/app/comparisons', 'saved-comparisons', 'workspace'), page('/app/collections', 'collections', 'workspace'), page('/app/recent', 'history', 'workspace'),
  page('/app/research', 'saved-research', 'workspace'), page('/app/notes', 'notes', 'workspace'), page('/app/history', 'history', 'workspace'),
  page('/account', 'account', 'workspace'), page('/account/profile', 'account', 'workspace'), page('/account/settings', 'preferences', 'workspace'),
  page('/account/security', 'security', 'workspace'), page('/account/sessions', 'sessions', 'workspace'), page('/notifications', 'notifications', 'workspace'),
];
const toRegex = (pattern: string) => new RegExp(`^${pattern === '/' ? '/' : pattern.replace(/\[[^\]]+\]/g, '[^/]+')}/?$`);
const COMPILED = ROUTES.map((r) => ({ r, re: toRegex(r.pattern) }));
/** The most specific registered route for a pathname (static segments win over dynamic ones). */
export function matchRoute(pathname: string): RouteSpec | null {
  const hits = COMPILED.filter((c) => c.re.test(pathname)).map((c) => c.r);
  return hits.sort((a, b) => (a.pattern.match(/\[/g)?.length ?? 0) - (b.pattern.match(/\[/g)?.length ?? 0))[0] ?? null;
}
/**
 * True for a page path that no page in src/app answers (tests/telemetry.test.ts keeps ROUTES equal to the page files).
 * Such a path shows the 404 page to everyone rather than a sign-in redirect: nothing is served there, so there is
 * nothing to protect. API paths, auth and public paths are never "unknown pages".
 */
export function isUnknownPage(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (p === '/api' || p.startsWith('/api/')) return false;
  return classifyPath(p) === 'protected' && !matchRoute(p);
}
