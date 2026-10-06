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
  { label: 'Research', href: '/research', hint: 'Notes, not recommendations', items: [['Stock research', '/research/stocks', ''], ['ETF research', '/research/etfs', ''], ['Market research', '/research/markets', ''], ['Theme research', '/research/themes', '']] },
  { label: 'Resources', href: '/resources', hint: 'News, calendars and learning', items: [['News', '/resources/news', ''], ['Earnings', '/resources/earnings', ''], ['Dividends', '/resources/dividends', ''], ['IPOs', '/resources/ipo', ''], ['Calendar', '/resources/calendar', ''], ['Learn', '/resources/learn', ''], ['Glossary', '/resources/glossary', ''], ['Data and methodology', '/resources/data', '']] },
] as const;

export const ACCOUNT_NAV = [['Workspace', '/app'], ['Notifications', '/notifications'], ['Profile', '/account/profile'], ['Settings', '/account/settings'], ['Security', '/account/security']] as const;

export const WORKSPACE_NAV = [
  { group: 'My workspace', items: [['Overview', '/app', 'LayoutDashboard', null], ['Watchlist', '/app/watchlist', 'Star', 'watchlist_items'], ['Alerts', '/app/alerts', 'Bell', 'alerts'], ['Notifications', '/notifications', 'Inbox', null]] },
  { group: 'Discover', items: [['Saved screens', '/app/screens', 'Filter', 'saved_screens'], ['Saved comparisons', '/app/comparisons', 'Columns2', 'saved_comparisons'], ['Collections', '/app/collections', 'LayoutGrid', 'collections'], ['Recent', '/app/recent', 'Clock', null]] },
  { group: 'Research', items: [['Saved research', '/app/research', 'FileText', 'saved_research'], ['Notes', '/app/notes', 'StickyNote', 'notes'], ['History', '/app/history', 'History', null]] },
  { group: 'System', items: [['Settings', '/account/settings', 'Settings', null], ['Security', '/account/security', 'Shield', null], ['Help', '/support', 'LifeBuoy', null]] },
] as const;
