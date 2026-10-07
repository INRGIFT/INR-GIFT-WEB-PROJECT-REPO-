import type { Asset, MarketView } from './types';

/**
 * Entity quality gate (docs/SEO.md). A public entity URL is indexable only if it has a valid immutable identity,
 * a current value from a source, enough data to be useful, and a status that is not an error or unavailable.
 * The global demo-data guard (config.isIndexable) applies on top of this: demo data is never indexed.
 */
export interface Quality { indexable: boolean; reasons: string[] }
const MIN_METRICS = 4;

export function assetQuality(a: Asset): Quality {
  const reasons: string[] = [];
  if (!/^ins_\d{6}$/.test(a.id)) reasons.push('no valid instrument id');
  if (a.price == null) reasons.push('no current value');
  if (a.status === 'ERROR' || a.status === 'UNAVAILABLE') reasons.push(`status ${a.status}`);
  if (!a.meta?.source) reasons.push('no source');
  const metrics = Object.values(a.m).filter((v) => v != null).length;
  if (metrics < MIN_METRICS) reasons.push(`only ${metrics} metrics`);
  if (!a.description || a.description.length < 40) reasons.push('thin description');
  return { indexable: reasons.length === 0, reasons };
}
/** A market page needs covered listings or an index to be more than a calendar entry. */
export function marketQuality(m: MarketView, coveredAssets: number): Quality {
  const reasons: string[] = [];
  if (coveredAssets === 0) reasons.push('no covered listings');
  if (m.dataStatus === 'UNAVAILABLE' || m.dataStatus === 'ERROR') reasons.push(`status ${m.dataStatus}`);
  return { indexable: reasons.length === 0, reasons };
}

/** Unique, truthful titles in the INRGIFT pattern, e.g. "AAPL Stock: Price, Performance, Valuation & Research". */
export function assetTitle(a: Asset): string {
  switch (a.cls) {
    case 'stock': return `${a.symbol} Stock: Price, Performance, Valuation & Research`;
    case 'etf': case 'fund': return `${a.symbol} ETF: Holdings, Expense Ratio, Performance & Research`;
    case 'index': return `${a.name}: Performance, Constituents & Research`;
    case 'fx': return `${a.fx ? `${a.fx.base}/${a.fx.quote}` : a.symbol} Exchange Rate: Chart, Performance & INR Context`;
    case 'commodity': return `${a.name} Price: Chart, Performance & Context`;
    case 'bond': return `${a.name}: Yield, Duration & Performance`;
    case 'reit': return `${a.symbol} REIT: Yield, Valuation, Distributions & Research`;
  }
}
