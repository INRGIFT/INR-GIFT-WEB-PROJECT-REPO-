import { config } from '@/lib/config';
import type { Asset } from '@/lib/types';

/**
 * Stock and ETF logos. Components ask `getLogoProvider()` for a URL and always have a text tile to fall back to,
 * so a missing, blocked or failed logo never shows a broken image. Provider selection lives in config
 * (NEXT_PUBLIC_LOGO_PROVIDER); swapping Logo.dev for another source means adding a class here, nothing else.
 *
 * Logo.dev terms (verified 2026-10-06, docs/CONNECTORS.md): the publishable `pk_` key is designed for browser use and
 * should be domain-restricted in the Logo.dev dashboard; the secret key is never used here. Images are loaded from
 * Logo.dev's CDN, not proxied or stored — storing logos requires their API and secret key. The free plan
 * requires a visible "Logos provided by Logo.dev" link.
 */
export interface LogoRequest { size?: number; theme?: 'light' | 'dark' }
export interface LogoFallback { text: string; label: string }
export interface LogoProvider {
  readonly name: string;
  /** Whether the provider's terms require a visible attribution link. */
  readonly attribution: { text: string; href: string } | null;
  getLogoByTicker(symbol: string, opts?: LogoRequest): string | null;
  getLogoByExchange(symbol: string, mic: string, opts?: LogoRequest): string | null;
  getCompanyLogo(asset: Pick<Asset, 'symbol' | 'mic' | 'cls'>, opts?: LogoRequest): string | null;
  getEtfLogo(asset: Pick<Asset, 'symbol' | 'mic' | 'cls'>, opts?: LogoRequest): string | null;
  getFallbackLogo(asset: Pick<Asset, 'symbol' | 'name'>): LogoFallback;
}

/** Ticker tile used whenever no logo is available. */
export const fallbackLogo = (a: Pick<Asset, 'symbol' | 'name'>): LogoFallback => ({ text: a.symbol.replace(/[^A-Z0-9]/gi, '').slice(0, 5), label: a.name });

/** Only stocks, ETFs and REITs have issuer logos. Indices, FX, commodities and bonds always use the tile. */
const HAS_LOGO = new Set<Asset['cls']>(['stock', 'etf', 'reit', 'fund']);

/**
 * Exchange (ISO 10383 MIC) → Logo.dev ticker suffix. Only suffixes listed in Logo.dev's documentation are mapped;
 * an unmapped exchange gets the tile rather than a guessed URL that might resolve to a different company.
 */
export const LOGO_DEV_SUFFIX: Record<string, string> = {
  XNYS: '', XNAS: '', ARCX: '', BATS: '', XASE: '',
  XTSE: '.TO', BVMF: '.SA', XLON: '.L', XPAR: '.PA', XAMS: '.AS', XETR: '.DE', XSWX: '.SW', XTKS: '.T', XHKG: '.HK',
  XSHG: '.SS', XTAI: '.TW', XKRX: '.KS', XNSE: '.NS', XBOM: '.BO', XSES: '.SI', XASX: '.AX', XSAU: '.SR', XJSE: '.JO',
};

export class LogoDevProvider implements LogoProvider {
  readonly name = 'logo.dev';
  readonly attribution = { text: 'Logos provided by Logo.dev', href: 'https://logo.dev' };
  constructor(private publishableKey: string) {}
  getLogoByTicker(symbol: string, { size = 64, theme }: LogoRequest = {}) {
    if (!/^[A-Z0-9.\-]{1,15}$/i.test(symbol)) return null;
    const q = new URLSearchParams({ token: this.publishableKey, size: String(size), format: 'png', retina: 'true', fallback: '404' });
    if (theme) q.set('theme', theme);
    return `https://img.logo.dev/ticker/${encodeURIComponent(symbol)}?${q}`;
  }
  getLogoByExchange(symbol: string, mic: string, opts?: LogoRequest) {
    const suffix = LOGO_DEV_SUFFIX[mic];
    return suffix === undefined ? null : this.getLogoByTicker(`${symbol}${suffix}`, opts);
  }
  getCompanyLogo(a: Pick<Asset, 'symbol' | 'mic' | 'cls'>, opts?: LogoRequest) { return HAS_LOGO.has(a.cls) && a.cls !== 'etf' ? this.getLogoByExchange(a.symbol, a.mic, opts) : null; }
  getEtfLogo(a: Pick<Asset, 'symbol' | 'mic' | 'cls'>, opts?: LogoRequest) { return a.cls === 'etf' ? this.getLogoByExchange(a.symbol, a.mic, opts) : null; }
  getFallbackLogo = fallbackLogo;
}

/** No logo source configured: everything renders as a ticker tile. */
export class NoLogoProvider implements LogoProvider {
  readonly name = 'none';
  readonly attribution = null;
  getLogoByTicker() { return null; }
  getLogoByExchange() { return null; }
  getCompanyLogo() { return null; }
  getEtfLogo() { return null; }
  getFallbackLogo = fallbackLogo;
}

let instance: LogoProvider | null = null;
export function getLogoProvider(): LogoProvider {
  instance ??= config.logoProvider === 'logo.dev' && config.logoDevKey.startsWith('pk_') ? new LogoDevProvider(config.logoDevKey) : new NoLogoProvider();
  return instance;
}
/** Logo URL for any asset, or null when the tile should be shown. */
export function logoUrl(a: Pick<Asset, 'symbol' | 'mic' | 'cls'>, opts?: LogoRequest): string | null {
  const p = getLogoProvider();
  return a.cls === 'etf' ? p.getEtfLogo(a, opts) : p.getCompanyLogo(a, opts);
}

/** URLs that failed in this browser session; they are not requested again. */
const failed = new Set<string>();
export const markLogoFailed = (url: string) => { failed.add(url); };
export const logoFailed = (url: string) => failed.has(url);
