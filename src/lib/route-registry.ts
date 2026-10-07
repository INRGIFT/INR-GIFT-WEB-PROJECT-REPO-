/**
 * Route registry: every intended route, its shell, access rule, indexing rule and feature. Middleware (auth guard and
 * X-Robots-Tag), robots.txt and the route tests read this table, so a route's rules live in one place.
 *
 * index:     'index'   public and indexable (still subject to the demo-data guard and entity quality, docs/SEO.md)
 *            'faceted' indexable base page; query-string variants are noindex,follow with a canonical to the base
 *            'noindex' never indexed (auth screens, internal search, private pages)
 * canonical: 'self' (path without query) or 'base' (strip every query parameter)
 */
export type Layout = 'site' | 'workspace' | 'auth' | 'api';
export type Access = 'public' | 'private' | 'auth';
export interface RouteSpec { pattern: string; layout: Layout; access: Access; index: 'index' | 'faceted' | 'noindex'; canonical: 'self' | 'base'; feature: string; sample?: string }

const pub = (pattern: string, feature: string, index: RouteSpec['index'] = 'index', sample?: string): RouteSpec => ({ pattern, layout: 'site', access: 'public', index, canonical: index === 'faceted' ? 'base' : 'self', feature, sample });
const auth = (pattern: string): RouteSpec => ({ pattern, layout: 'auth', access: 'auth', index: 'noindex', canonical: 'self', feature: 'auth' });
const priv = (pattern: string, feature: string, layout: Layout = 'workspace'): RouteSpec => ({ pattern, layout, access: 'private', index: 'noindex', canonical: 'self', feature });

export const ROUTES: RouteSpec[] = [
  pub('/', 'home'),
  pub('/markets', 'markets', 'faceted'), pub('/markets/all', 'markets'), pub('/markets/[market]', 'markets', 'index', '/markets/India'),
  pub('/assets', 'assets'), pub('/assets/[cls]', 'assets', 'faceted', '/assets/stocks'),
  pub('/stocks/[symbol]', 'asset-detail', 'index', '/stocks/AAPL'), pub('/etfs/[symbol]', 'asset-detail', 'index', '/etfs/SPY'), pub('/etfs/[symbol]/review', 'etf-review', 'index', '/etfs/SPY/review'),
  pub('/indices/[index]', 'asset-detail', 'index', '/indices/NIFTY-50'), pub('/fx/[pair]', 'asset-detail', 'index', '/fx/USD-INR'), pub('/commodities/[commodity]', 'asset-detail', 'index', '/commodities/GOLD'),
  pub('/bonds/[bond]', 'asset-detail', 'index', '/bonds/US-10Y'), pub('/reits/[reit]', 'asset-detail', 'index', '/reits/PLD'),
  pub('/discover', 'discover'), pub('/discover/heatmap', 'heatmap', 'faceted'), pub('/discover/screener', 'screener', 'faceted'), pub('/discover/compare', 'compare', 'faceted'),
  pub('/discover/collections', 'collections'), pub('/discover/collections/[id]', 'collections', 'index', '/discover/collections/india'), pub('/discover/trending', 'trending'),
  pub('/research', 'research'), pub('/research/[kind]', 'research', 'index', '/research/stocks'), pub('/research/[kind]/[slug]', 'research', 'index', '/research/sectors/technology'),
  pub('/resources', 'resources'), pub('/resources/[kind]', 'resources', 'index', '/resources/news'),
  pub('/resources/learn/[slug]', 'learn', 'index', '/resources/learn/etf-basics'), pub('/resources/glossary/[slug]', 'glossary', 'index', '/resources/glossary/beta'),
  pub('/search', 'search', 'noindex'),
  pub('/about', 'company'), pub('/pricing', 'company'), pub('/faq', 'company'), pub('/support', 'company'), pub('/contact', 'company'), pub('/legal/[doc]', 'legal', 'index', '/legal/privacy'),
  auth('/login'), auth('/signup'), auth('/verify'), auth('/verify-phone'), auth('/mfa'), auth('/forgot-password'), auth('/reset-password'),
  { pattern: '/auth/callback', layout: 'api', access: 'public', index: 'noindex', canonical: 'self', feature: 'auth' },
  { pattern: '/auth/confirm', layout: 'api', access: 'public', index: 'noindex', canonical: 'self', feature: 'auth' },
  priv('/onboarding', 'onboarding', 'auth'),
  priv('/app', 'workspace'), priv('/app/watchlist', 'watchlists'), priv('/app/alerts', 'alerts'), priv('/app/screens', 'saved-screens'), priv('/app/comparisons', 'saved-comparisons'),
  priv('/app/collections', 'collections'), priv('/app/recent', 'history'), priv('/app/research', 'saved-research'), priv('/app/notes', 'notes'), priv('/app/history', 'history'),
  priv('/account', 'account'), priv('/account/profile', 'account'), priv('/account/settings', 'preferences'), priv('/account/security', 'security'), priv('/notifications', 'notifications'),
];

const toRegex = (pattern: string) => new RegExp(`^${pattern === '/' ? '/' : pattern.replace(/\[[^\]]+\]/g, '[^/]+')}/?$`);
const COMPILED = ROUTES.map((r) => ({ r, re: toRegex(r.pattern) }));
/** The most specific registered route for a pathname (static segments win over dynamic ones). */
export function matchRoute(pathname: string): RouteSpec | null {
  const hits = COMPILED.filter((c) => c.re.test(pathname)).map((c) => c.r);
  return hits.sort((a, b) => (a.pattern.match(/\[/g)?.length ?? 0) - (b.pattern.match(/\[/g)?.length ?? 0))[0] ?? null;
}
/** Path prefixes that require a session. */
export const PRIVATE_PREFIXES = ['/app', '/account', '/notifications', '/onboarding'];
export const isPrivatePath = (p: string) => PRIVATE_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));
/** Prefixes kept out of crawling entirely (robots.txt). */
export const DISALLOWED_PREFIXES = ['/api/', ...PRIVATE_PREFIXES, ...ROUTES.filter((r) => r.access === 'auth').map((r) => r.pattern), '/auth/', '/search'];
/** Whether a pathname (without query) is noindex by rule, before content quality is considered. */
export const isNoindexPath = (p: string) => isPrivatePath(p) || matchRoute(p)?.index === 'noindex';
