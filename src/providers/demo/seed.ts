import type { Exchange, Market, Region } from '@/lib/types';

/** Demo seed. Shapes mirror supabase/migrations/0002_market_data.sql so a real ingest can replace it table for table. */
const WK = [1, 2, 3, 4, 5];
const COMMON = { '2026-01-01': "New Year's Day", '2026-12-25': 'Christmas Day', '2027-01-01': "New Year's Day" };
type Ex = [mic: string, name: string, tz: string, open: string, close: string, extra?: Partial<Exchange>];
const ex = ([mic, name, timezone, open, close, extra]: Ex): Exchange => ({ mic, name, timezone, open, close, tradingDays: WK, holidays: COMMON, ...extra });
type Mk = [id: string, slug: string, name: string, region: Region, cc: string, ccy: string, feed: 'LIVE' | 'DELAYED', exchanges: Ex[], override?: Market['statusOverride']];

const MARKET_ROWS: Mk[] = [
  ['us', 'US', 'United States', 'North America', 'US', 'USD', 'LIVE', [['XNYS', 'NYSE', 'America/New_York', '09:30', '16:00', { preOpen: '04:00', postClose: '20:00', holidays: { ...COMMON, '2026-11-26': 'Thanksgiving Day', '2026-07-03': 'Independence Day (observed)' }, halfDays: { '2026-11-27': '13:00', '2026-12-24': '13:00' } }], ['XNAS', 'NASDAQ', 'America/New_York', '09:30', '16:00'], ['ARCX', 'NYSE Arca', 'America/New_York', '09:30', '16:00']]],
  ['ca', 'Canada', 'Canada', 'North America', 'CA', 'CAD', 'DELAYED', [['XTSE', 'Toronto Stock Exchange', 'America/Toronto', '09:30', '16:00']]],
  ['br', 'Brazil', 'Brazil', 'Latin America', 'BR', 'BRL', 'DELAYED', [['BVMF', 'B3', 'America/Sao_Paulo', '10:00', '17:00']], 'STALE'],
  ['uk', 'UK', 'United Kingdom', 'Europe', 'GB', 'GBP', 'DELAYED', [['XLON', 'London Stock Exchange', 'Europe/London', '08:00', '16:30']]],
  ['de', 'Germany', 'Germany', 'Europe', 'DE', 'EUR', 'LIVE', [['XETR', 'Xetra', 'Europe/Berlin', '09:00', '17:30']]],
  ['fr', 'France', 'France', 'Europe', 'FR', 'EUR', 'DELAYED', [['XPAR', 'Euronext Paris', 'Europe/Paris', '09:00', '17:30']]],
  ['ch', 'Switzerland', 'Switzerland', 'Europe', 'CH', 'CHF', 'DELAYED', [['XSWX', 'SIX Swiss Exchange', 'Europe/Zurich', '09:00', '17:20']]],
  ['nl', 'Netherlands', 'Netherlands', 'Europe', 'NL', 'EUR', 'DELAYED', [['XAMS', 'Euronext Amsterdam', 'Europe/Amsterdam', '09:00', '17:30']]],
  ['jp', 'Japan', 'Japan', 'Asia-Pacific', 'JP', 'JPY', 'DELAYED', [['XTKS', 'Tokyo Stock Exchange', 'Asia/Tokyo', '09:00', '15:30', { breakStart: '11:30', breakEnd: '12:30', holidays: { ...COMMON, '2026-11-03': 'Culture Day', '2026-11-23': 'Labour Thanksgiving Day' } }]]],
  ['hk', 'Hong-Kong', 'Hong Kong', 'Asia-Pacific', 'HK', 'HKD', 'DELAYED', [['XHKG', 'HKEX', 'Asia/Hong_Kong', '09:30', '16:00', { breakStart: '12:00', breakEnd: '13:00' }]]],
  ['cn', 'China', 'China', 'Asia-Pacific', 'CN', 'CNY', 'DELAYED', [['XSHG', 'Shanghai Stock Exchange', 'Asia/Shanghai', '09:30', '15:00', { breakStart: '11:30', breakEnd: '13:00', holidays: { ...COMMON, '2026-10-01': 'National Day', '2026-10-02': 'National Day holiday', '2026-10-05': 'National Day holiday', '2026-10-06': 'National Day holiday', '2026-10-07': 'National Day holiday' } }], ['XSHE', 'Shenzhen Stock Exchange', 'Asia/Shanghai', '09:30', '15:00']]],
  ['tw', 'Taiwan', 'Taiwan', 'Asia-Pacific', 'TW', 'TWD', 'DELAYED', [['XTAI', 'Taiwan Stock Exchange', 'Asia/Taipei', '09:00', '13:30']]],
  ['kr', 'South-Korea', 'South Korea', 'Asia-Pacific', 'KR', 'KRW', 'DELAYED', [['XKRX', 'Korea Exchange', 'Asia/Seoul', '09:00', '15:30']]],
  ['sg', 'Singapore', 'Singapore', 'Asia-Pacific', 'SG', 'SGD', 'DELAYED', [['XSES', 'Singapore Exchange', 'Asia/Singapore', '09:00', '17:00']]],
  ['au', 'Australia', 'Australia', 'Asia-Pacific', 'AU', 'AUD', 'DELAYED', [['XASX', 'ASX', 'Australia/Sydney', '10:00', '16:00']]],
  ['in', 'India', 'India', 'Asia-Pacific', 'IN', 'INR', 'LIVE', [['XNSE', 'NSE', 'Asia/Kolkata', '09:15', '15:30', { preOpen: '09:00', holidays: { ...COMMON, '2026-10-02': 'Mahatma Gandhi Jayanti', '2026-01-26': 'Republic Day' } }], ['XBOM', 'BSE', 'Asia/Kolkata', '09:15', '15:30'], ['INSE', 'NSE IX (GIFT City)', 'Asia/Kolkata', '06:30', '02:45']]],
  ['ae', 'UAE', 'United Arab Emirates', 'Middle East', 'AE', 'AED', 'DELAYED', [['XDFM', 'Dubai Financial Market', 'Asia/Dubai', '10:00', '15:00'], ['XADS', 'Abu Dhabi Securities Exchange', 'Asia/Dubai', '10:00', '15:00']]],
  ['sa', 'Saudi-Arabia', 'Saudi Arabia', 'Middle East', 'SA', 'SAR', 'DELAYED', [['XSAU', 'Saudi Exchange (Tadawul)', 'Asia/Riyadh', '10:00', '15:00', { tradingDays: [7, 1, 2, 3, 4] }]], 'UNAVAILABLE'],
  ['za', 'South-Africa', 'South Africa', 'Africa', 'ZA', 'ZAR', 'DELAYED', [['XJSE', 'Johannesburg Stock Exchange', 'Africa/Johannesburg', '09:00', '17:00']]],
];
export const MARKETS: Market[] = MARKET_ROWS.map(([id, slug, name, region, countryCode, currency, feed, exchanges, statusOverride]) => ({ id, slug, name, region, countryCode, currency, feed, exchanges: exchanges.map(ex), statusOverride }));

/** Demo reference rates: units of INR per one unit of currency. */
export const INR_PER: Record<string, number> = { USD: 88.4, EUR: 103.9, GBP: 118.7, JPY: 0.592, HKD: 11.35, TWD: 2.86, KRW: 0.064, SGD: 68.5, AUD: 58.2, BRL: 16.3, SAR: 23.57, AED: 24.07, CAD: 64.1, ZAR: 5.02, CHF: 110.4, CNY: 12.4, INR: 1 };

/** symbol, name, market, mic, sector, industry, price, mcap $bn, P/E, fwd P/E, rev growth, ROIC, div yield, beta, issuer */
export type StockRow = [string, string, string, string, string, string, number, number, number, number, number, number, number, number, string?];
export const STOCKS: StockRow[] = [
  ['NVDA', 'NVIDIA', 'us', 'XNAS', 'Technology', 'Semiconductors', 182.4, 4450, 48.2, 33.1, 62, 78, 0.03, 1.72],
  ['AAPL', 'Apple', 'us', 'XNAS', 'Technology', 'Consumer Electronics', 254.1, 3780, 33.4, 30.2, 6, 55, 0.42, 1.18],
  ['MSFT', 'Microsoft', 'us', 'XNAS', 'Technology', 'Software', 512.75, 3810, 36.1, 31.4, 15, 29, 0.68, 0.94],
  ['AMZN', 'Amazon', 'us', 'XNAS', 'Consumer Discretionary', 'Internet Retail', 228.6, 2430, 34.8, 28.9, 11, 14, 0, 1.24],
  ['GOOGL', 'Alphabet', 'us', 'XNAS', 'Communication Services', 'Internet Services', 246.3, 2980, 25.6, 22.7, 13, 31, 0.34, 1.05],
  ['META', 'Meta Platforms', 'us', 'XNAS', 'Communication Services', 'Internet Services', 715.2, 1800, 26.9, 24.1, 19, 33, 0.29, 1.22],
  ['JPM', 'JPMorgan Chase', 'us', 'XNYS', 'Financials', 'Banks', 308.4, 850, 15.2, 14.6, 5, 16, 1.9, 1.08],
  ['XOM', 'Exxon Mobil', 'us', 'XNYS', 'Energy', 'Integrated Oil & Gas', 113.8, 490, 15.8, 14.1, -3, 11, 3.5, 0.62],
  ['LLY', 'Eli Lilly', 'us', 'XNYS', 'Healthcare', 'Pharmaceuticals', 742.5, 705, 41, 29.5, 38, 36, 0.8, 0.48],
  ['TSLA', 'Tesla', 'us', 'XNAS', 'Consumer Discretionary', 'Automobiles', 428.9, 1380, 210, 140, 2, 8, 0, 2.05],
  ['TSM', 'TSMC (ADR)', 'us', 'XNYS', 'Technology', 'Semiconductors', 268.5, 1180, 27, 22, 34, 32, 1.4, 1.2, 'TSMC'],
  ['SHOP', 'Shopify', 'ca', 'XTSE', 'Technology', 'Software', 212.4, 198, 88, 70, 27, 12, 0, 1.9],
  ['PETR4', 'Petrobras', 'br', 'BVMF', 'Energy', 'Integrated Oil & Gas', 31.85, 78, 5.1, 4.8, -4, 15, 11.2, 0.9],
  ['AZN', 'AstraZeneca', 'uk', 'XLON', 'Healthcare', 'Pharmaceuticals', 112.4, 232, 29, 18.5, 12, 13, 2.1, 0.42],
  ['SHEL', 'Shell', 'uk', 'XLON', 'Energy', 'Integrated Oil & Gas', 27.15, 215, 11.2, 9.8, -6, 10, 3.9, 0.7],
  ['HSBA', 'HSBC Holdings', 'uk', 'XLON', 'Financials', 'Banks', 10.42, 250, 9.6, 9.1, 3, 13, 5.1, 0.85],
  ['SAP', 'SAP', 'de', 'XETR', 'Technology', 'Software', 232.5, 312, 44, 34, 9, 17, 1, 0.98],
  ['SIE', 'Siemens', 'de', 'XETR', 'Industrials', 'Conglomerates', 238.9, 205, 22, 19, 5, 13, 2.2, 1.1],
  ['MC', 'LVMH', 'fr', 'XPAR', 'Consumer Discretionary', 'Luxury Goods', 548.2, 318, 23, 21, -2, 15, 2.4, 1.15],
  ['NESN', 'Nestlé', 'ch', 'XSWX', 'Consumer Staples', 'Packaged Foods', 78.3, 232, 18, 17, 1, 14, 3.9, 0.45],
  ['ASML', 'ASML Holding', 'nl', 'XAMS', 'Technology', 'Semiconductor Equipment', 842, 372, 36, 29, 16, 44, 0.8, 1.3],
  ['7203', 'Toyota Motor', 'jp', 'XTKS', 'Consumer Discretionary', 'Automobiles', 2915, 298, 9.4, 9.9, 4, 9, 3.1, 0.8],
  ['6758', 'Sony Group', 'jp', 'XTKS', 'Technology', 'Consumer Electronics', 4210, 172, 21, 19, 3, 11, 0.5, 1],
  ['0700', 'Tencent Holdings', 'hk', 'XHKG', 'Communication Services', 'Internet Services', 648, 760, 24, 20, 12, 19, 0.7, 0.95],
  ['2330', 'TSMC', 'tw', 'XTAI', 'Technology', 'Semiconductors', 1385, 1180, 27, 22, 34, 32, 1.4, 1.2, 'TSMC'],
  ['005930', 'Samsung Electronics', 'kr', 'XKRX', 'Technology', 'Semiconductors', 89400, 415, 17, 12, 14, 9, 1.6, 1.1],
  ['D05', 'DBS Group', 'sg', 'XSES', 'Financials', 'Banks', 52.6, 115, 12.9, 12.6, 4, 17, 4.6, 0.8],
  ['BHP', 'BHP Group', 'au', 'XASX', 'Materials', 'Mining', 41.9, 140, 13, 12.5, -2, 20, 4.4, 0.9],
  ['RELIANCE', 'Reliance Industries', 'in', 'XNSE', 'Energy', 'Conglomerates', 1418, 217, 24, 21, 8, 9, 0.4, 1.05],
  ['TCS', 'Tata Consultancy Services', 'in', 'XNSE', 'Technology', 'IT Services', 3015, 123, 22, 20.5, 5, 52, 2, 0.7],
  ['HDFCBANK', 'HDFC Bank', 'in', 'XNSE', 'Financials', 'Banks', 978, 170, 20.4, 17.9, 9, 15, 1.1, 0.9],
  ['INFY', 'Infosys', 'in', 'XNSE', 'Technology', 'IT Services', 1492, 70, 22.6, 21, 5, 31, 2.9, 0.75],
  ['EMAAR', 'Emaar Properties', 'ae', 'XDFM', 'Real Estate', 'Developers', 13.9, 33, 8.7, 8.1, 22, 16, 7.2, 0.9],
  ['2222', 'Saudi Aramco', 'sa', 'XSAU', 'Energy', 'Integrated Oil & Gas', 24.6, 1590, 16, 15, -5, 20, 5.4, 0.4],
  ['NPN', 'Naspers', 'za', 'XJSE', 'Communication Services', 'Internet Services', 6120, 60, 14, 12, 10, 8, 0.3, 1.2],
];
/** Stocks whose fundamentals the demo source deliberately does not supply. */
export const NO_FUNDAMENTALS = new Set(['EMAAR']);
/** ETFs whose holdings the demo source deliberately does not supply. */
export const NO_HOLDINGS = new Set(['INDA']);

/** symbol, name, strategy, benchmark, price, AUM $bn, expense %, yield %, holdings, issuer, inception, top holdings */
export type EtfRow = [string, string, string, string, number, number, number, number, number, string, string, Record<string, number>];
const SP: Record<string, number> = { NVDA: 8.1, MSFT: 6.9, AAPL: 6.6, AMZN: 4, META: 3.1, GOOGL: 2.6, TSLA: 2.2, JPM: 1.5, LLY: 1.2, XOM: 0.9 };
export const ETFS: EtfRow[] = [
  ['SPY', 'SPDR S&P 500 ETF Trust', 'Broad market', 'S&P 500', 672.4, 690, 0.0945, 1.1, 503, 'State Street', '1993-01-22', SP],
  ['VOO', 'Vanguard S&P 500 ETF', 'Broad market', 'S&P 500', 618.1, 780, 0.03, 1.15, 505, 'Vanguard', '2010-09-07', SP],
  ['QQQ', 'Invesco QQQ Trust', 'Large-cap growth', 'NASDAQ-100', 604.3, 385, 0.2, 0.5, 101, 'Invesco', '1999-03-10', { NVDA: 10, MSFT: 8.6, AAPL: 8.1, AMZN: 5.6, META: 3.9, GOOGL: 3.2, TSLA: 3.1 }],
  ['GLD', 'SPDR Gold Shares', 'Commodity', 'LBMA Gold Price PM', 362.8, 128, 0.4, 0, 1, 'State Street', '2004-11-18', {}],
  ['VWO', 'Vanguard FTSE Emerging Markets ETF', 'Emerging markets', 'FTSE Emerging Markets All Cap', 54.6, 102, 0.07, 2.6, 5900, 'Vanguard', '2005-03-04', { '2330': 10.2, '0700': 4.6, RELIANCE: 1.4, HDFCBANK: 1.3, INFY: 0.8, NPN: 0.5 }],
  ['SCHD', 'Schwab US Dividend Equity ETF', 'Dividend', 'Dow Jones US Dividend 100', 27.4, 72, 0.06, 3.7, 103, 'Charles Schwab', '2011-10-20', { XOM: 4.1 }],
  ['SOXX', 'iShares Semiconductor ETF', 'Thematic', 'NYSE Semiconductor', 298.5, 16, 0.34, 0.6, 30, 'BlackRock', '2001-07-10', { NVDA: 9.2, TSM: 4.3, ASML: 4 }],
  ['INDA', 'iShares MSCI India ETF', 'International', 'MSCI India', 53.2, 9.4, 0.62, 0.7, 160, 'BlackRock', '2012-02-02', {}],
];
export const ETF_SECTORS: Record<string, [string, number][]> = {
  SPY: [['Technology', 33], ['Financials', 13], ['Healthcare', 10], ['Consumer Discretionary', 10], ['Communication Services', 9], ['Industrials', 8], ['Other', 17]],
  QQQ: [['Technology', 58], ['Communication Services', 16], ['Consumer Discretionary', 13], ['Healthcare', 5], ['Other', 8]],
  GLD: [['Physical gold', 100]],
  VWO: [['Technology', 26], ['Financials', 22], ['Consumer Discretionary', 13], ['Communication Services', 9], ['Other', 30]],
  SCHD: [['Energy', 19], ['Consumer Staples', 18], ['Healthcare', 16], ['Industrials', 13], ['Other', 34]],
  SOXX: [['Semiconductors', 79], ['Semiconductor Equipment', 21]],
};
ETF_SECTORS.VOO = ETF_SECTORS.SPY;
export const ETF_COUNTRIES: Record<string, [string, number][]> = {
  SPY: [['United States', 100]], VOO: [['United States', 100]], QQQ: [['United States', 97], ['Other', 3]], GLD: [['Global (bullion)', 100]],
  VWO: [['China', 28], ['Taiwan', 22], ['India', 20], ['Brazil', 5], ['Other', 25]], SCHD: [['United States', 100]], SOXX: [['United States', 86], ['Netherlands', 9], ['Taiwan', 5]],
};
/** slug, name, market, level, 1D %, constituents */
export const INDICES: [string, string, string, number, number, number][] = [
  ['SP-500', 'S&P 500', 'us', 6712.4, 0.42, 503], ['NASDAQ-COMPOSITE', 'NASDAQ Composite', 'us', 22480.6, 0.71, 3300], ['DOW-JONES', 'Dow Jones Industrial Average', 'us', 46210.3, 0.12, 30],
  ['SP-TSX', 'S&P/TSX Composite', 'ca', 29840.2, -0.18, 220], ['BOVESPA', 'Bovespa', 'br', 143220, 0.56, 86], ['FTSE-100', 'FTSE 100', 'uk', 9412.8, -0.24, 100],
  ['DAX', 'DAX', 'de', 24105.5, 0.33, 40], ['CAC-40', 'CAC 40', 'fr', 7988.1, -0.41, 40], ['SMI', 'SMI', 'ch', 12340.7, 0.08, 20], ['AEX', 'AEX', 'nl', 948.3, 0.62, 25],
  ['NIKKEI-225', 'Nikkei 225', 'jp', 45620.9, 1.12, 225], ['HANG-SENG', 'Hang Seng', 'hk', 26480.4, -0.86, 82], ['SSE-COMPOSITE', 'SSE Composite', 'cn', 3862.5, 0.21, 2200],
  ['TAIEX', 'TAIEX', 'tw', 26210.7, 0.94, 1000], ['KOSPI', 'KOSPI', 'kr', 3498.2, 0.48, 840], ['STI', 'Straits Times Index', 'sg', 4388.6, 0.15, 30], ['ASX-200', 'S&P/ASX 200', 'au', 8902.4, -0.32, 200],
  ['NIFTY-50', 'NIFTY 50', 'in', 25184.6, 0.28, 50], ['SENSEX', 'S&P BSE SENSEX', 'in', 82210.4, 0.31, 30], ['GIFT-NIFTY', 'GIFT Nifty', 'in', 25231.5, 0.34, 50],
  ['DFM-GENERAL', 'DFM General Index', 'ae', 5924.1, 0.44, 40], ['TASI', 'Tadawul All Share', 'sa', 11482.3, -0.2, 240], ['JSE-TOP-40', 'FTSE/JSE Top 40', 'za', 98740.5, 0.67, 40],
];
export const FX_PAIRS: [string, string, number][] = [['USD', 'INR', 88.4], ['EUR', 'INR', 103.9], ['GBP', 'INR', 118.7], ['JPY', 'INR', 0.592], ['AED', 'INR', 24.07], ['SGD', 'INR', 68.5], ['EUR', 'USD', 1.1753], ['USD', 'JPY', 149.32], ['GBP', 'USD', 1.3428]];
/** slug, name, price, unit, reference contract, forced status */
export const COMMODITIES: [string, string, number, string, string, ('ERROR' | undefined)?][] = [
  ['GOLD', 'Gold', 3942.6, 'USD per troy ounce', 'COMEX front-month'], ['SILVER', 'Silver', 47.82, 'USD per troy ounce', 'COMEX front-month'],
  ['BRENT', 'Brent Crude', 68.4, 'USD per barrel', 'ICE front-month'], ['WTI', 'WTI Crude', 64.75, 'USD per barrel', 'NYMEX front-month'],
  ['NATGAS', 'Natural Gas', 3.412, 'USD per MMBtu', 'NYMEX Henry Hub front-month', 'ERROR'], ['COPPER', 'Copper', 4.86, 'USD per pound', 'COMEX front-month'],
];
/** slug, name, market, price, yield, coupon, duration, maturity, rating, issuer */
export const BONDS: [string, string, string, number, number, number, number, string, string, string][] = [
  ['US-10Y', 'US Treasury 10-Year Note', 'us', 98.42, 4.18, 4.0, 8.1, '2036-08-15', 'AA+', 'United States Treasury'],
  ['IN-10Y', 'India Government Bond 10-Year', 'in', 100.35, 6.52, 6.57, 7.0, '2036-09-08', 'BBB', 'Government of India'],
  ['DE-10Y', 'German Bund 10-Year', 'de', 98.9, 2.71, 2.6, 8.6, '2036-08-15', 'AAA', 'Federal Republic of Germany'],
  ['JP-10Y', 'Japan Government Bond 10-Year', 'jp', 99.1, 1.62, 1.5, 9.1, '2036-09-20', 'A+', 'Government of Japan'],
  ['UK-10Y', 'UK Gilt 10-Year', 'uk', 97.85, 4.61, 4.375, 7.8, '2036-07-31', 'AA', 'HM Treasury'],
];
/** symbol, name, market, mic, price, mcap $bn, yield, FFO yield, occupancy, property type, geography */
export const REITS: [string, string, string, string, number, number, number, number, number, string, string][] = [
  ['PLD', 'Prologis', 'us', 'XNYS', 124.6, 115, 3.2, 4.6, 95.2, 'Industrial and logistics', 'Global'],
  ['EMBASSY', 'Embassy Office Parks REIT', 'in', 'XNSE', 412.3, 4.4, 5.6, 6.1, 91.0, 'Office', 'India'],
  ['C38U', 'CapitaLand Integrated Commercial Trust', 'sg', 'XSES', 2.31, 12.8, 4.8, 5.2, 97.1, 'Retail and office', 'Singapore'],
  ['0823', 'Link REIT', 'hk', 'XHKG', 41.2, 13.6, 6.4, 6.9, 96.4, 'Retail', 'Hong Kong and Asia-Pacific'],
];
export const THEMES: [string, string, string, string[]][] = [
  ['ai-semiconductors', 'AI & Semiconductors', 'Chip designers, foundries, equipment makers and the ETF that tracks them', ['NVDA', 'TSM', '2330', 'ASML', '005930', 'SOXX']],
  ['mega-caps', 'Mega Caps', 'Companies above one trillion US dollars in market value', ['NVDA', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 'TSLA', '2222', '2330']],
  ['global-banks', 'Global Banks', 'Large lenders across four regions', ['JPM', 'HSBA', 'D05', 'HDFCBANK']],
  ['dividend-leaders', 'Dividend Leaders', 'Companies and funds with a trailing yield of 3.5% or more', ['PETR4', 'EMAAR', '2222', 'HSBA', 'D05', 'BHP', 'SHEL', 'NESN', 'SCHD', 'XOM']],
  ['india', 'India', 'NSE-listed leaders, an Indian REIT and an India-focused ETF', ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'EMBASSY', 'INDA']],
  ['energy', 'Energy', 'Integrated oil and gas producers across five markets', ['XOM', 'SHEL', 'PETR4', '2222', 'RELIANCE']],
  ['global-etfs', 'Global ETFs', 'Broad, thematic, commodity and international funds', ['SPY', 'VOO', 'QQQ', 'GLD', 'VWO', 'SCHD', 'SOXX', 'INDA']],
];
export const NEWS: [string, string, string][] = [
  ['NVDA', 'Technology', 'Data-centre revenue mix in focus ahead of results'], ['2330', 'Technology', 'Monthly revenue update: what the trend says about chip demand'],
  ['RELIANCE', 'India', 'Energy and retail segments: the numbers to watch this quarter'], ['7203', 'Asia', 'Yen moves and automaker margins: a currency-adjusted view'],
  ['HSBA', 'Financials', 'Rate expectations and bank net interest margins across regions'], ['XOM', 'Energy', 'Crude range holds: implications for integrated oil cash flows'],
  ['AAPL', 'Technology', 'Services growth and hardware cycles: reading the segment data'], ['SAP', 'Europe', 'Cloud backlog and the transition from licences: a margin view'],
  ['HDFCBANK', 'India', 'Deposit growth, credit costs and what the quarterly update shows'], ['SPY', 'Global', 'Index concentration: how much of the benchmark sits in ten names'],
  ['ASML', 'Europe', 'Order intake and lithography demand: a look at the bookings data'], ['MSFT', 'Technology', 'Cloud capacity spending and its effect on free cash flow'],
];
export const MACRO: [number, string, string, string][] = [
  [2, 'US Consumer Price Index', 'Monthly inflation release', 'us'], [5, 'RBI Monetary Policy Committee decision', 'Repo rate announcement', 'in'], [9, 'India Consumer Price Index', 'Monthly inflation release', 'in'],
  [14, 'ECB monetary policy decision', 'Deposit rate announcement', 'de'], [21, 'US Federal Open Market Committee decision', 'Federal funds rate announcement', 'us'], [26, 'Bank of Japan policy decision', 'Policy rate announcement', 'jp'], [30, 'US non-farm payrolls', 'Monthly employment report', 'us'],
];
export const IPOS: [number, string, string, string, string][] = [
  [6, 'Aurora Grid Systems (demo listing)', 'in', 'Industrials', 'Upcoming'], [12, 'Meridian Health Analytics (demo listing)', 'us', 'Healthcare', 'Upcoming'],
  [-4, 'Kestrel Logistics (demo listing)', 'sg', 'Industrials', 'Priced'], [-11, 'Harbourline Semiconductor (demo listing)', 'tw', 'Technology', 'Listed'], [-20, 'Solace Renewables (demo listing)', 'uk', 'Utilities', 'Listed'],
];

/**
 * Reference-only securities and listings that complete an issuer's identity but are not priced in the demo dataset.
 * Facts are public listing data (ticker, exchange, depositary ratio); ISINs are left null rather than typed in.
 * [issuer key, security name, share class, kind, MIC, ticker, currency, ratio or null, underlying ticker or null]
 */
export const REFERENCE_LISTINGS: [string, string, string, 'ordinary' | 'adr' | 'gdr', string, string, string, string | null, string | null][] = [
  ['alphabet', 'Alphabet Inc. Class C', 'Class C', 'ordinary', 'XNAS', 'GOOG', 'USD', null, null],
  ['infosys', 'Infosys ADR', 'ADR', 'adr', 'XNYS', 'INFY', 'USD', '1 ADR = 1 ordinary share', 'INFY'],
  ['hdfc-bank', 'HDFC Bank ADR', 'ADR', 'adr', 'XNYS', 'HDB', 'USD', '1 ADR = 3 ordinary shares', 'HDFCBANK'],
  ['reliance-industries', 'Reliance Industries GDR', 'GDR', 'gdr', 'XLON', 'RIGD', 'USD', '1 GDR = 2 ordinary shares', 'RELIANCE'],
];
/** Depositary ratios for receipts that are priced in the demo dataset. */
export const DR_RATIOS: Record<string, [string, string]> = { TSM: ['1 ADR = 5 ordinary shares', '2330'] };
/** Share classes of priced listings (default "Ordinary"). */
export const SHARE_CLASS: Record<string, string> = { GOOGL: 'Class A' };
