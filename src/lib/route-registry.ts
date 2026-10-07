/**
 * Route registry and access policy. Middleware, robots.txt, the sitemap and the tests all read this file, so a route's
 * rules live in one place.
 *
 * ACCESS POLICY (default deny):
 *   public      "/" (the homepage) and the few pages listed in PUBLIC_PAGES with a stated reason
 *   auth        sign-in, sign-up and verification infrastructure, open so people can authenticate
 *   public-api  endpoints that must work before sign-in and protect themselves (health, auth steps, signed hooks, contact)
 *   file        static and metadata files (robots, sitemap, icons, share images, files in /public)
 *   protected   EVERYTHING ELSE, pages and /api alike: requires a fully verified session (src/features/auth/policy.ts)
 * A new route is protected automatically; making something public means adding it here with a reason.
 */
export type Access = 'public' | 'auth' | 'public-api' | 'file' | 'protected';
export type Layout = 'site' | 'workspace' | 'auth' | 'api';
export interface RouteSpec { pattern: string; layout: Layout; access: Access; index: 'index' | 'noindex'; feature: string }

/**
 * Pages public besides the homepage, and why. Decision recorded in docs/DECISIONS.md (7 Oct 2026):
 *   /legal/*   Terms and Privacy must be readable before someone accepts them at sign-up; Indian IT Rules 2021 require
 *              the grievance officer details to be published; risk disclosure and refund terms are pre-purchase notices.
 *   /support   Account recovery when a phone is lost happens before sign-in is possible.
 *   /contact   The only way for someone who cannot sign in to reach INRGIFT (and the grievance channel).
 */
export const PUBLIC_PAGES = ['/', '/legal', '/support', '/contact'];
export const AUTH_PAGES = ['/login', '/signup', '/verify', '/verify-phone', '/mfa', '/forgot-password', '/reset-password', '/auth/callback', '/auth/confirm'];
export const PUBLIC_API = ['/api/health', '/api/auth', '/api/hooks', '/api/contact', '/api/internal'];
const METADATA_FILES = ['/robots.txt', '/sitemap.xml', '/sitemap', '/manifest.webmanifest', '/icon', '/apple-icon', '/opengraph-image', '/twitter-image', '/favicon.ico'];
/** Files served from /public (brand, fonts, media, posters): marketing assets with no product data. Only root-level
 * files and these folders count, so a page path with a file-like suffix (/stocks/AAPL.png) stays protected. */
const FILE_EXT = /\.(?:svg|png|jpe?g|gif|webp|avif|ico|webm|mp4|vtt|json|woff2?|ttf|otf|css|js|map|txt|xml|webmanifest)$/i;
const FILE_DIRS = /^\/(?:brand|fonts|media)\/|^\/[^/]+$/;

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
/** Only the homepage and the public pages may be indexed; everything else (and anything with a query) is noindex. */
export const isIndexablePath = (p: string) => classifyPath(p) === 'public';
export const isNoindexPath = (p: string) => !isIndexablePath(p);

const page = (pattern: string, feature: string, layout: Layout = 'site'): RouteSpec => {
  const access = classifyPath(pattern.replace(/\[[^\]]+\]/g, 'x'));
  return { pattern, layout, access, index: access === 'public' ? 'index' : 'noindex', feature };
};
/** Every page in src/app (tests/telemetry.test.ts checks none is missing). Access comes from classifyPath. */
export const ROUTES: RouteSpec[] = [
  page('/', 'home'),
  page('/markets', 'markets'), page('/markets/all', 'markets'), page('/markets/[market]', 'markets'),
  page('/assets', 'assets'), page('/assets/[cls]', 'assets'),
  page('/stocks/[symbol]', 'asset-detail'), page('/etfs/[symbol]', 'asset-detail'), page('/etfs/[symbol]/review', 'etf-review'),
  page('/indices/[index]', 'asset-detail'), page('/fx/[pair]', 'asset-detail'), page('/commodities/[commodity]', 'asset-detail'),
  page('/bonds/[bond]', 'asset-detail'), page('/reits/[reit]', 'asset-detail'),
  page('/discover', 'discover'), page('/discover/heatmap', 'heatmap'), page('/discover/screener', 'screener'), page('/discover/compare', 'compare'),
  page('/discover/collections', 'collections'), page('/discover/collections/[id]', 'collections'), page('/discover/trending', 'trending'),
  page('/research', 'research'), page('/research/[kind]', 'research'), page('/research/[kind]/[slug]', 'research'),
  page('/resources', 'resources'), page('/resources/[kind]', 'resources'), page('/resources/learn/[slug]', 'learn'), page('/resources/glossary/[slug]', 'glossary'),
  page('/search', 'search'),
  page('/about', 'company'), page('/pricing', 'company'), page('/faq', 'company'), page('/support', 'company'), page('/contact', 'company'), page('/legal/[doc]', 'legal'),
  page('/login', 'auth', 'auth'), page('/signup', 'auth', 'auth'), page('/verify', 'auth', 'auth'), page('/verify-phone', 'auth', 'auth'), page('/mfa', 'auth', 'auth'),
  page('/forgot-password', 'auth', 'auth'), page('/reset-password', 'auth', 'auth'),
  page('/onboarding', 'onboarding', 'auth'),
  page('/app', 'workspace', 'workspace'), page('/app/watchlist', 'watchlists', 'workspace'), page('/app/alerts', 'alerts', 'workspace'), page('/app/screens', 'saved-screens', 'workspace'),
  page('/app/comparisons', 'saved-comparisons', 'workspace'), page('/app/collections', 'collections', 'workspace'), page('/app/recent', 'history', 'workspace'),
  page('/app/research', 'saved-research', 'workspace'), page('/app/notes', 'notes', 'workspace'), page('/app/history', 'history', 'workspace'),
  page('/account', 'account', 'workspace'), page('/account/profile', 'account', 'workspace'), page('/account/settings', 'preferences', 'workspace'),
  page('/account/security', 'security', 'workspace'), page('/notifications', 'notifications', 'workspace'),
];
const toRegex = (pattern: string) => new RegExp(`^${pattern === '/' ? '/' : pattern.replace(/\[[^\]]+\]/g, '[^/]+')}/?$`);
const COMPILED = ROUTES.map((r) => ({ r, re: toRegex(r.pattern) }));
/** The most specific registered route for a pathname (static segments win over dynamic ones). */
export function matchRoute(pathname: string): RouteSpec | null {
  const hits = COMPILED.filter((c) => c.re.test(pathname)).map((c) => c.r);
  return hits.sort((a, b) => (a.pattern.match(/\[/g)?.length ?? 0) - (b.pattern.match(/\[/g)?.length ?? 0))[0] ?? null;
}
