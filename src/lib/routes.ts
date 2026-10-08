import type { AssetClass } from './types';

export const CLASS_PATH: Record<AssetClass, string> = { stock: 'stocks', etf: 'etfs', index: 'indices', fx: 'fx', commodity: 'commodities', bond: 'bonds', reit: 'reits', fund: 'etfs' };
export const CLASS_LABEL: Record<AssetClass, { one: string; many: string }> = {
  stock: { one: 'Stock', many: 'Stocks' }, etf: { one: 'ETF', many: 'ETFs' }, index: { one: 'Index', many: 'Indices' }, fx: { one: 'Currency pair', many: 'FX' },
  commodity: { one: 'Commodity', many: 'Commodities' }, bond: { one: 'Bond', many: 'Bonds' }, reit: { one: 'REIT', many: 'REITs' }, fund: { one: 'Fund', many: 'Funds' },
};
/** /assets/<segment> → class. */
export const DIRECTORY_CLASS: Record<string, AssetClass> = { stocks: 'stock', etfs: 'etf', indices: 'index', fx: 'fx', commodities: 'commodity', bonds: 'bond', reits: 'reit', funds: 'fund' };
export const directoryHref = (cls: AssetClass) => `/assets/${cls === 'fund' ? 'funds' : CLASS_PATH[cls]}`;
export const assetHref = (a: { cls: AssetClass; slug: string }) => `/${CLASS_PATH[a.cls]}/${a.slug}`;
export const marketHref = (slug: string) => `/markets/${slug}`;
export const researchHref = (d: { kind: string; slug: string }) => `/research/${d.kind}/${d.slug}`;
export const collectionHref = (id: string) => `/discover/collections/${id}`;
export const learnHref = (slug: string) => `/resources/learn/${slug}`;
export const glossaryHref = (slug: string) => `/resources/glossary/${slug}`;
export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const NAV = [
  { label: 'Markets', href: '/markets', hint: 'Sessions, indices and movers', items: [['Global overview', '/markets', 'Sessions, indices and movers'], ['Markets directory', '/markets/all', 'Every covered market'], ['Heatmap', '/discover/heatmap', 'Drill from region to company'], ['Market calendar', '/resources/calendar', 'Holidays, earnings and macro']] },
  { label: 'Assets', href: '/assets', hint: 'Every asset class', items: [['Stocks', '/assets/stocks', ''], ['ETFs', '/assets/etfs', ''], ['Indices', '/assets/indices', ''], ['FX', '/assets/fx', ''], ['Commodities', '/assets/commodities', ''], ['Bonds', '/assets/bonds', ''], ['REITs', '/assets/reits', ''], ['Funds', '/assets/funds', '']] },
  { label: 'Discover', href: '/discover', hint: 'Find what to research next', items: [['Screener', '/discover/screener', 'Filter the global universe'], ['Compare', '/discover/compare', 'Up to four assets'], ['Heatmap', '/discover/heatmap', 'Signature market map'], ['Themes and collections', '/discover/collections', 'Curated groups across markets'], ['Trending', '/discover/trending', 'Movers and activity']] },
  { label: 'Research', href: '/research', hint: 'Notes, not recommendations', items: [['Stock research', '/research/stocks', ''], ['ETF research', '/research/etfs', ''], ['Market research', '/research/markets', ''], ['Theme research', '/research/themes', ''], ['Sector research', '/research/sectors', ''], ['Country research', '/research/countries', '']] },
  { label: 'Resources', href: '/resources', hint: 'News, calendars and learning', items: [['News', '/news', ''], ['Earnings', '/resources/earnings', ''], ['Dividends', '/resources/dividends', ''], ['IPOs', '/resources/ipo', ''], ['Calendar', '/resources/calendar', ''], ['Learn', '/resources/learn', ''], ['Glossary', '/resources/glossary', ''], ['Data and methodology', '/resources/data', '']] },
] as const;

export const ACCOUNT_NAV = [['Workspace', '/app'], ['Notifications', '/notifications'], ['Profile', '/account/profile'], ['Settings', '/account/settings'], ['Security', '/account/security']] as const;


/**
 * The authenticated application's vertical navigation (src/components/layout/app-shell.tsx). Each item names its
 * icon (lucide), and `match` decides which item is current for a path, so asset and research pages light up the right
 * section. `table` shows a real count from the workspace for that item; nothing else is counted.
 */
export interface AppNavItem { label: string; href: string; icon: string; match: RegExp; table?: 'watchlist_items' | 'alerts' | 'saved_research' }
export const APP_NAV: { group: string; items: AppNavItem[] }[] = [
  { group: 'Workspace', items: [
    { label: 'Home', href: '/app', icon: 'LayoutDashboard', match: /^\/app\/?$/ },
    { label: 'Discover', href: '/discover', icon: 'Compass', match: /^\/discover(?!\/(screener|compare))(\/|$)/ },
    { label: 'Markets', href: '/markets', icon: 'Globe2', match: /^\/(markets|assets|stocks|etfs|indices|fx|commodities|bonds|reits)(\/|$)/ },
    { label: 'Screeners', href: '/discover/screener', icon: 'SlidersHorizontal', match: /^\/discover\/screener(\/|$)/ },
    { label: 'Compare', href: '/discover/compare', icon: 'Columns2', match: /^\/discover\/compare(\/|$)/ },
    { label: 'Research', href: '/research', icon: 'FileText', match: /^\/research(\/|$)/ },
    { label: 'News', href: '/news', icon: 'Newspaper', match: /^\/news(\/|$)/ },
    { label: 'Watchlists', href: '/app/watchlist', icon: 'Star', match: /^\/app\/watchlist(\/|$)/, table: 'watchlist_items' },
    { label: 'Alerts', href: '/app/alerts', icon: 'Bell', match: /^\/app\/alerts(\/|$)/, table: 'alerts' },
    { label: 'Saved Research', href: '/app/research', icon: 'Bookmark', match: /^\/app\/research(\/|$)/, table: 'saved_research' },
  ] },
  { group: 'Account', items: [
    { label: 'Profile', href: '/account/profile', icon: 'UserRound', match: /^\/account(\/profile)?\/?$/ },
    { label: 'Security', href: '/account/security', icon: 'Shield', match: /^\/account\/security(\/|$)/ },
    { label: 'Sessions', href: '/account/sessions', icon: 'MonitorSmartphone', match: /^\/account\/sessions(\/|$)/ },
    { label: 'Preferences', href: '/account/settings', icon: 'Settings', match: /^\/account\/settings(\/|$)/ },
  ] },
  { group: 'Support', items: [
    { label: 'Support', href: '/support', icon: 'LifeBuoy', match: /^\/support(\/|$)/ },
    { label: 'Grievance Redressal', href: '/grievance-redressal', icon: 'MessageSquareWarning', match: /^\/grievance-redressal(\/|$)/ },
    { label: 'Account Closure', href: '/account-closure', icon: 'DoorOpen', match: /^\/account-closure(\/|$)/ },
  ] },
];
/** The rest of the workspace, one level down in the sidebar ("More"). */
export const APP_NAV_MORE: AppNavItem[] = [
  { label: 'Saved screens', href: '/app/screens', icon: 'Filter', match: /^\/app\/screens(\/|$)/ },
  { label: 'Saved comparisons', href: '/app/comparisons', icon: 'Columns2', match: /^\/app\/comparisons(\/|$)/ },
  { label: 'Collections', href: '/app/collections', icon: 'LayoutGrid', match: /^\/app\/collections(\/|$)/ },
  { label: 'Notes', href: '/app/notes', icon: 'StickyNote', match: /^\/app\/notes(\/|$)/ },
  { label: 'Recent', href: '/app/recent', icon: 'Clock', match: /^\/app\/recent(\/|$)/ },
  { label: 'History', href: '/app/history', icon: 'History', match: /^\/app\/history(\/|$)/ },
  { label: 'Notifications', href: '/notifications', icon: 'Inbox', match: /^\/notifications(\/|$)/ },
  { label: 'Calendar', href: '/resources/calendar', icon: 'CalendarDays', match: /^\/resources\/(calendar|earnings|dividends|ipo)(\/|$)/ },
  { label: 'Learn and glossary', href: '/resources/learn', icon: 'GraduationCap', match: /^\/resources(\/(learn|glossary|data)(\/|$)|\/?$)/ },
];
/** Title for the application top bar: the navigation item that owns the path, else the section, else INRGIFT. */
export function appTitle(pathname: string): string {
  const all = [...APP_NAV.flatMap((g) => g.items), ...APP_NAV_MORE];
  const hit = all.find((i) => i.match.test(pathname));
  if (hit) return hit.label;
  if (pathname.startsWith('/search')) return 'Search';
  if (pathname.startsWith('/resources')) return 'Resources';
  return 'INRGIFT';
}
