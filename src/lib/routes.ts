import type { AssetClass } from './types';

export const CLASS_PATH: Record<AssetClass, string> = { stock: 'stocks', etf: 'etfs', index: 'indices', fx: 'fx', commodity: 'commodities', bond: 'bonds', reit: 'reits', fund: 'etfs' };
export const CLASS_LABEL: Record<AssetClass, { one: string; many: string }> = {
  stock: { one: 'Stock', many: 'Stocks' }, etf: { one: 'ETF', many: 'ETFs' }, index: { one: 'Index', many: 'Indices' }, fx: { one: 'Currency pair', many: 'FX' },
  commodity: { one: 'Commodity', many: 'Commodities' }, bond: { one: 'Bond', many: 'Bonds' }, reit: { one: 'REIT', many: 'REITs' }, fund: { one: 'Fund', many: 'Funds' },
};
/** /assets/<segment> → class. */
export const DIRECTORY_CLASS: Record<string, AssetClass> = { stocks: 'stock', etfs: 'etf', indices: 'index', fx: 'fx', commodities: 'commodity', bonds: 'bond', reits: 'reit', funds: 'fund' };
export const assetHref = (a: { cls: AssetClass; slug: string }) => `/${CLASS_PATH[a.cls]}/${a.slug}`;
export const marketHref = (slug: string) => `/markets/${slug}`;

export const NAV = [
  { label: 'Markets', href: '/markets', items: [['Global overview', '/markets', 'Sessions, indices and movers'], ['Markets directory', '/markets/all', 'Every covered market'], ['Heatmap', '/discover/heatmap', 'Drill from region to company'], ['Market calendar', '/resources/calendar', 'Holidays, earnings and macro']] },
  { label: 'Assets', href: '/assets', items: [['Stocks', '/assets/stocks', ''], ['ETFs', '/assets/etfs', ''], ['Indices', '/assets/indices', ''], ['FX', '/assets/fx', ''], ['Commodities', '/assets/commodities', ''], ['Bonds', '/assets/bonds', ''], ['REITs', '/assets/reits', ''], ['Funds', '/assets/funds', '']] },
  { label: 'Discover', href: '/discover', items: [['Screener', '/discover/screener', 'Filter the global universe'], ['Compare', '/discover/compare', 'Up to four assets'], ['Heatmap', '/discover/heatmap', 'Signature market map'], ['Collections', '/discover/collections', 'Themes and curated groups'], ['Trending', '/discover/trending', 'Movers and activity']] },
  { label: 'Research', href: '/research', items: [['Stock research', '/research/stocks', ''], ['ETF research', '/research/etfs', ''], ['Market research', '/research/markets', ''], ['Themes', '/research/themes', '']] },
  { label: 'Resources', href: '/resources/news', items: [['News', '/resources/news', ''], ['Earnings', '/resources/earnings', ''], ['Dividends', '/resources/dividends', ''], ['IPOs', '/resources/ipo', ''], ['Calendar', '/resources/calendar', ''], ['Learn', '/resources/learn', ''], ['Glossary', '/resources/glossary', ''], ['Data and methodology', '/resources/data', '']] },
] as const;

export const WORKSPACE_NAV = [
  { group: 'My workspace', items: [['Overview', '/app', 'LayoutDashboard', null], ['Watchlist', '/app/watchlist', 'Star', 'watchlist_items'], ['Alerts', '/app/alerts', 'Bell', 'alerts']] },
  { group: 'Discover', items: [['Saved Screens', '/app/screens', 'Filter', 'saved_screens'], ['Saved Comparisons', '/app/comparisons', 'Columns2', 'saved_comparisons'], ['Collections', '/app/collections', 'LayoutGrid', null], ['Recent', '/app/recent', 'Clock', null]] },
  { group: 'Research', items: [['Saved Research', '/app/research', 'FileText', 'saved_research'], ['Notes', '/app/notes', 'StickyNote', 'notes'], ['History', '/app/history', 'History', null]] },
  { group: 'System', items: [['Settings', '/account/settings', 'Settings', null], ['Help', '/support', 'LifeBuoy', null]] },
] as const;
