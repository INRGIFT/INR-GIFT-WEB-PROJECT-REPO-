import type { Asset, AssetClass, Market, Region } from '@/lib/types';
import { assetHref, marketHref } from '@/lib/routes';
import type { NewsArticle, NewsEntity, NewsRelevance, NewsTopic, RawArticle } from './news-types';

/**
 * INRGIFT business-relevance engine. INRGIFT is market intelligence, not a general news site: an article is shown in
 * normal feeds only when it is about markets, companies, assets, economies or market-moving policy and events.
 * Scoring is transparent (reasons[]) and deterministic. It is a ranking aid, not a judgement of financial importance.
 */

/** Market and business vocabulary per topic. Matched as whole words or phrases, case-insensitive. */
export const TOPIC_TERMS: Record<Exclude<NewsTopic, 'politics-markets' | 'geopolitics' | 'markets' | 'business'>, string[]> = {
  equities: ['stock', 'stocks', 'shares', 'equity', 'equities', 'stock market', 'stock markets', 'bourse', 'market cap', 'market capitalisation', 'market capitalization', 'blue chip', 'small-cap', 'mid-cap', 'large-cap', 'sensex', 'nifty', 'nasdaq', 'dow jones', 's&p 500', 'ftse', 'nikkei', 'hang seng', 'dax', 'cac 40', 'market rally', 'stock rally', 'stocks rally', 'shares rally', 'sell-off', 'selloff'],
  indices: ['index', 'indices', 'nifty 50', 'bank nifty', 's&p 500', 'nasdaq composite', 'nasdaq 100', 'stoxx 600', 'msci', 'benchmark index'],
  macro: ['gdp', 'inflation', 'cpi', 'wpi', 'pmi', 'unemployment', 'jobless', 'payrolls', 'recession', 'economic growth', 'economy', 'economies', 'fiscal deficit', 'current account', 'trade deficit', 'industrial output', 'iip', 'consumer spending', 'retail sales', 'economic data'],
  'central-banks': ['central bank', 'rbi', 'reserve bank', 'federal reserve', 'the fed', 'fed chair', 'fomc', 'ecb', 'european central bank', 'bank of england', 'bank of japan', 'boj', 'pboc', 'monetary policy', 'interest rate', 'interest rates', 'rate cut', 'rate cuts', 'rate hike', 'rate hikes', 'repo rate', 'policy rate', 'basis points'],
  fx: ['rupee', 'forex', 'currency', 'currencies', 'exchange rate', 'dollar index', 'yen', 'yuan', 'euro', 'sterling', 'usd/inr', 'devaluation', 'foreign exchange'],
  commodities: ['crude', 'crude oil', 'oil prices', 'brent', 'wti', 'opec', 'opec+', 'gold', 'silver', 'copper', 'aluminium', 'aluminum', 'natural gas', 'lng', 'commodity', 'commodities', 'metals', 'iron ore', 'wheat', 'soybean', 'coal'],
  bonds: ['bond', 'bonds', 'bond yield', 'bond yields', 'yield', 'yields', 'treasury', 'treasuries', 'gilt', 'gilts', 'g-sec', 'sovereign debt', 'fixed income', 'credit rating', 'downgrade', 'spreads', 'debt market'],
  etfs: ['etf', 'etfs', 'exchange-traded fund', 'exchange-traded funds', 'index fund', 'fund flows', 'inflows', 'outflows'],
  earnings: ['earnings', 'quarterly results', 'quarterly profit', 'net profit', 'net income', 'revenue', 'revenues', 'eps', 'guidance', 'profit warning', 'q1 results', 'q2 results', 'q3 results', 'q4 results', 'beat estimates', 'missed estimates'],
  ipo: ['ipo', 'ipos', 'initial public offering', 'listing', 'listings', 'market debut', 'drhp', 'public offering', 'goes public', 'listed on'],
  'corporate-actions': ['merger', 'mergers', 'acquisition', 'acquisitions', 'acquire', 'acquires', 'm&a', 'takeover', 'buyback', 'share buyback', 'dividend', 'dividends', 'stake', 'stock split', 'demerger', 'rights issue', 'spin-off', 'delisting'],
  trade: ['tariff', 'tariffs', 'trade deal', 'trade war', 'trade talks', 'exports', 'imports', 'supply chain', 'supply chains', 'customs duty', 'wto', 'free trade', 'shipping', 'freight'],
  regulation: ['sebi', 'sec', 'regulator', 'regulators', 'regulation', 'regulatory', 'antitrust', 'competition commission', 'compliance', 'licence', 'license', 'ban on', 'probe into', 'fine'],
};
/** Political and geopolitical vocabulary: counted only when an economic or market link is present. */
const POLITICS = ['election', 'elections', 'government', 'parliament', 'congress', 'senate', 'minister', 'prime minister', 'president', 'budget', 'tax', 'taxes', 'taxation', 'policy', 'subsidy', 'stimulus', 'coalition', 'cabinet'];
const GEOPOLITICS = ['sanctions', 'sanction', 'war', 'conflict', 'military', 'missile', 'ceasefire', 'embargo', 'blockade', 'red sea', 'strait of hormuz', 'shipping lanes', 'border tensions', 'invasion', 'geopolitical', 'geopolitics'];
const BUSINESS = ['company', 'companies', 'firm', 'ceo', 'chief executive', 'investment', 'investors', 'funding', 'valuation', 'layoffs', 'plant', 'factory', 'startup', 'conglomerate', 'bank', 'banks', 'banking', 'lender', 'insurer', 'financial services', 'capex'];
/** Off-topic signals. They lower the score; they do not blindly remove market stories (see score()). */
const OFF_TOPIC = ['cricket', 'football', 'soccer', 'ipl', 'tennis', 'olympics', 'world cup', 'match', 'tournament', 'goal', 'wicket', 'bollywood', 'hollywood', 'movie', 'movies', 'film', 'box office', 'actor', 'actress', 'singer', 'album', 'concert', 'celebrity', 'celebrities', 'fashion', 'recipe', 'recipes', 'travel', 'horoscope', 'gossip', 'wedding', 'dating', 'murder', 'arrested', 'stabbing', 'assault', 'diet', 'workout', 'skincare', 'viral video', 'smartphone review', 'gaming'];
/**
 * Promotional crypto/token copy (paid placements, presales, "next 100x" pieces). These are advertising, not market
 * reporting, so they are pushed below the feed threshold whatever else they mention.
 */
const PROMO = ['presale', 'pre-sale', 'token presale', 'crypto presale', 'airdrop', 'meme coin', 'memecoin', 'meme coins', '100x', '1000x', '50x', 'next big crypto', 'best crypto to buy', 'crypto to buy now', 'top crypto to buy', 'token sale', 'whitelist', 'giveaway', 'sponsored', 'paid content', 'price prediction', 'altcoin to buy', 'early investors'];
/** Municipal and local-government vocabulary: local politics stays out unless the story has a strong market core. */
const LOCAL = ['mayor', 'mayoral', 'city council', 'council member', 'councilmember', 'councilwoman', 'councilman', 'county commissioner', 'county board', 'school board', 'school district', 'police chief', 'sheriff', 'zoning', 'city hall', 'municipal election', 'ward', 'alderman', 'homeless', 'homelessness'];
/**
 * Paid press-release distribution sites (anyone can publish there). Major wires (PR Newswire, GlobeNewswire, Business
 * Wire) also carry real company announcements, so they get only a small penalty; open release boards a large one.
 * Matched on the provider's source id or the article's host, never guessed from the headline.
 */
const RELEASE_BOARDS = ['openpr', 'einpresswire', 'issuewire', 'prfree', 'pressreleasepoint', 'newswire.com', 'prlog'];
const WIRES = ['prnewswire', 'globenewswire', 'businesswire', 'accessnewswire', 'accesswire'];
const OFF_CATEGORIES = new Set(['sports', 'entertainment', 'lifestyle', 'food', 'tourism', 'health', 'education']);
const ON_CATEGORIES = new Set(['business']);

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const compile = (terms: string[]) => new RegExp(`(?:^|[^a-z0-9&])(${terms.map(esc).sort((a, b) => b.length - a.length).join('|')})(?=$|[^a-z0-9&])`, 'gi');
const TOPIC_RE = Object.fromEntries(Object.entries(TOPIC_TERMS).map(([k, v]) => [k, compile(v)])) as Record<keyof typeof TOPIC_TERMS, RegExp>;
const POLITICS_RE = compile(POLITICS), GEO_RE = compile(GEOPOLITICS), BUSINESS_RE = compile(BUSINESS), OFF_RE = compile(OFF_TOPIC), PROMO_RE = compile(PROMO), LOCAL_RE = compile(LOCAL);
/** The publisher's identity from provider fields only: source id plus the article and source hosts. */
const sourceKey = (raw: RawArticle) => { const host = (u: string | null) => { try { return u ? new URL(u).hostname.toLowerCase() : ''; } catch { return ''; } }; return `${(raw.source_id ?? '').toLowerCase()} ${host(raw.url)} ${host(raw.source_url)}`; };
const hits = (re: RegExp, text: string) => new Set(Array.from(text.matchAll(re), (m) => m[1].toLowerCase()));

/* --------------------------------------------- Entities --------------------------------------------- */
export interface EntityIndex { companies: { asset: Asset; re: RegExp }[]; tickers: Map<string, Asset>; markets: { market: Market; re: RegExp }[] }
const CORP_SUFFIX = ['inc', 'ltd', 'limited', 'corp', 'corporation', 'plc', 'group', 'holdings'].flatMap((w) => [w, w[0].toUpperCase() + w.slice(1), w.toUpperCase()]).join('|');
const SUFFIX = /\s+(inc\.?|ltd\.?|limited|corp\.?|corporation|plc|ag|sa|se|n\.v\.|co\.?|holdings?|group)$/i;
const MARKET_ALIASES: Record<string, string[]> = { US: ['United States', 'U.S.', 'Wall Street'], UK: ['United Kingdom', 'Britain', 'British', 'London Stock Exchange'], India: ['India', 'Indian', 'Dalal Street'], Japan: ['Japan', 'Japanese', 'Tokyo'], China: ['China', 'Chinese', 'Beijing', 'Shanghai'], 'Hong-Kong': ['Hong Kong'], Germany: ['Germany', 'German'], France: ['France', 'French'], 'South-Korea': ['South Korea', 'Korean'], Taiwan: ['Taiwan', 'Taiwanese'], Singapore: ['Singapore'], Australia: ['Australia', 'Australian'], Canada: ['Canada', 'Canadian'], Brazil: ['Brazil', 'Brazilian'], 'Saudi-Arabia': ['Saudi Arabia', 'Saudi'], UAE: ['United Arab Emirates', 'UAE', 'Dubai', 'Abu Dhabi'], Switzerland: ['Switzerland', 'Swiss'], Netherlands: ['Netherlands', 'Dutch'] };
/** Builds the matcher from INRGIFT's canonical universe. Read-only: news never changes the security master. */
export function buildEntityIndex(assets: Asset[], markets: Market[]): EntityIndex {
  const companies = assets.filter((a) => a.cls === 'stock' || a.cls === 'etf' || a.cls === 'reit').flatMap((a) => {
    const base = a.name.replace(/\s*\(.*\)$/, '').replace(SUFFIX, '').trim();
    // A one-word name ("Apple", "Shell") is ambiguous on its own: require a corporate suffix after it.
    const pattern = base.split(/\s+/).length >= 2 ? esc(base) : `${esc(base)}(?:\\s+(?:${CORP_SUFFIX})\\b|'s\\s+(?:shares|stock|results|earnings|profit|revenue))`;
    return base.length >= 3 ? [{ asset: a, re: new RegExp(`\\b${pattern}`, base.split(/\s+/).length >= 2 ? 'i' : '') }] : [];
  });
  const tickers = new Map(assets.filter((a) => a.cls === 'stock' || a.cls === 'etf' || a.cls === 'reit').map((a) => [a.symbol.toUpperCase(), a]));
  const ms = markets.map((m) => ({ market: m, re: new RegExp(`\\b(?:${(MARKET_ALIASES[m.slug] ?? [m.name]).map(esc).join('|')})(?![a-z])`) }));
  return { companies, tickers, markets: ms };
}
/** Tickers only with an explicit exchange prefix ("NASDAQ: AAPL", "NSE:RELIANCE") or a cashtag ("$AAPL"). */
const TICKER_RE = /\b(?:NASDAQ|NYSE|NSE|BSE|LSE|TSX|ASX|TSE|HKEX|XETRA|EURONEXT)\s*:\s*([A-Z][A-Z0-9.&-]{0,11})\b|\$([A-Z]{1,6})\b/g;
const CURRENCY_RE = /\b(USD|INR|EUR|JPY|GBP|CNY|CHF|AUD|CAD|SGD|AED)\b|\b(rupee|yen|yuan|euro|sterling|dollar)s?\b/gi;
const COMMODITY_RE = /\b(gold|silver|copper|crude oil|brent|wti|natural gas|iron ore|aluminium|aluminum)\b/gi;

function entities(text: string, idx: EntityIndex) {
  const companies = new Map<string, Asset>();
  for (const c of idx.companies) if (c.re.test(text)) companies.set(c.asset.id, c.asset);
  const tickers: string[] = [];
  for (const m of text.matchAll(TICKER_RE)) {
    const t = (m[1] ?? m[2] ?? '').toUpperCase();
    const a = idx.tickers.get(t);
    if (a) { tickers.push(t); companies.set(a.id, a); }
  }
  const markets = idx.markets.filter((m) => m.re.test(text)).map((m) => m.market);
  const currencies = new Set(Array.from(text.matchAll(CURRENCY_RE), (m) => (m[1] ?? m[2]).toLowerCase()));
  const commodities = new Set(Array.from(text.matchAll(COMMODITY_RE), (m) => m[1].toLowerCase()));
  return { companies: [...companies.values()], tickers: [...new Set(tickers)], markets, currencies: [...currencies], commodities: [...commodities] };
}

/* --------------------------------------------- Scoring --------------------------------------------- */
const STRONG: (keyof typeof TOPIC_TERMS)[] = ['equities', 'indices', 'macro', 'central-banks', 'fx', 'commodities', 'bonds', 'etfs', 'earnings', 'ipo', 'corporate-actions'];
export const RELEVANCE_THRESHOLDS = { high: 7, medium: 3.5 } as const;

export function classify(raw: RawArticle & { title: string }, idx: EntityIndex): NewsArticle['derived'] {
  const title = raw.title, body = `${raw.description ?? ''} ${raw.keywords.join(' ')}`;
  const text = `${title} ${body}`;
  const reasons: string[] = [];
  const topics = new Set<NewsTopic>();
  let market = 0;
  for (const t of Object.keys(TOPIC_TERMS) as (keyof typeof TOPIC_TERMS)[]) {
    const inTitle = hits(TOPIC_RE[t], title).size, inBody = hits(TOPIC_RE[t], body).size;
    if (!inTitle && !inBody) continue;
    topics.add(t);
    const w = (STRONG.includes(t) ? 1.5 : 1) * (inTitle * 2 + Math.min(inBody, 3));
    market += w;
    reasons.push(`${t} terms (+${w.toFixed(1)})`);
  }
  const ents = entities(text, idx);
  if (ents.companies.length) { market += 3; topics.add('business'); reasons.push(`company match: ${ents.companies.map((c) => c.symbol).join(', ')} (+3)`); }
  if (ents.commodities.length) { market += 1; topics.add('commodities'); }
  if (ents.currencies.length && topics.has('fx')) market += 1;
  const business = hits(BUSINESS_RE, text).size;
  if (business) { market += Math.min(business, 3) * 0.75; topics.add('business'); reasons.push(`business terms (+${(Math.min(business, 3) * 0.75).toFixed(2)})`); }
  if (raw.categories.some((c) => ON_CATEGORIES.has(c.toLowerCase()))) { market += 2; reasons.push('provider category business (+2)'); }
  const anchored = market >= 2;
  // Politics and geopolitics count only with an identifiable economic or market link in the same article.
  const pol = hits(POLITICS_RE, text).size, geo = hits(GEO_RE, text).size;
  let score = market;
  if (pol) { if (anchored) { score += Math.min(pol, 3); topics.add('politics-markets'); reasons.push(`politics with market link (+${Math.min(pol, 3)})`); } else reasons.push('politics without market link (0)'); }
  if (geo) { if (anchored || ents.commodities.length || topics.has('trade')) { score += Math.min(geo, 3); topics.add('geopolitics'); reasons.push(`geopolitics with market link (+${Math.min(geo, 3)})`); } else reasons.push('geopolitics without market link (0)'); }
  if (ents.markets.length) { score += 1; reasons.push(`market: ${ents.markets.map((m) => m.name).join(', ')} (+1)`); }
  // Off-topic signals penalise, but a story with a strong market core (e.g. a sports franchise IPO) is not dropped.
  const off = hits(OFF_RE, text).size + (raw.categories.some((c) => OFF_CATEGORIES.has(c.toLowerCase())) ? 2 : 0);
  if (off) { const pen = (market >= 6 ? 1 : 3) * Math.min(off, 3); score -= pen; reasons.push(`off-topic signals (−${pen})`); }
  // Local politics counts as off-topic unless the story has a strong market core (e.g. a city's bond rating).
  const local = hits(LOCAL_RE, text).size;
  if (local) { const pen = (market >= 6 ? 1 : 2.5) * Math.min(local, 2); score -= pen; reasons.push(`local politics (−${pen})`); }
  // Token promotions are advertising: always below the feed threshold.
  const promo = hits(PROMO_RE, text).size;
  if (promo) { const pen = 4 + 2 * Math.min(promo, 3); score -= pen; reasons.push(`promotional copy (−${pen})`); }
  const src = sourceKey(raw);
  if (RELEASE_BOARDS.some((b) => src.includes(b))) { score -= 5; reasons.push('press-release board (−5)'); }
  else if (WIRES.some((w) => src.includes(w))) { score -= 1.5; reasons.push('press-release wire (−1.5)'); }
  if (topics.size && [...topics].some((t) => t !== 'business' && t !== 'politics-markets' && t !== 'geopolitics')) topics.add('markets');
  const relevance: NewsRelevance = score >= RELEVANCE_THRESHOLDS.high ? 'high' : score >= RELEVANCE_THRESHOLDS.medium ? 'medium' : 'low';
  const order: NewsTopic[] = ['earnings', 'ipo', 'corporate-actions', 'central-banks', 'macro', 'fx', 'commodities', 'bonds', 'etfs', 'indices', 'equities', 'trade', 'regulation', 'geopolitics', 'politics-markets', 'business', 'markets'];
  const regionSet = new Set<Region>(ents.markets.map((m) => m.region));
  const classes = new Set<AssetClass>();
  if (topics.has('equities') || ents.companies.some((c) => c.cls === 'stock')) classes.add('stock');
  if (topics.has('etfs') || ents.companies.some((c) => c.cls === 'etf')) classes.add('etf');
  if (topics.has('indices')) classes.add('index');
  if (topics.has('fx')) classes.add('fx');
  if (topics.has('commodities')) classes.add('commodity');
  if (topics.has('bonds')) classes.add('bond');
  const ents2: NewsEntity[] = [
    ...ents.companies.map((a) => ({ kind: (a.cls === 'etf' ? 'etf' : 'company') as NewsEntity['kind'], id: a.id, name: a.name, href: assetHref(a) })),
    ...ents.markets.map((m) => ({ kind: 'market' as const, id: m.id, name: m.name, href: marketHref(m.slug) })),
    ...ents.currencies.map((c) => ({ kind: 'currency' as const, id: c, name: c.toUpperCase() })),
    ...ents.commodities.map((c) => ({ kind: 'commodity' as const, id: c, name: c })),
  ];
  return {
    topics: order.filter((t) => topics.has(t)), primary_topic: order.find((t) => topics.has(t)) ?? null,
    regions: [...regionSet], markets: ents.markets.map((m) => ({ id: m.id, name: m.name, slug: m.slug })),
    companies: ents.companies.map((a) => ({ id: a.id, name: a.name, slug: a.slug, symbol: a.symbol })), tickers: ents.tickers,
    asset_classes: [...classes], entities: ents2, relevance_score: Math.round(score * 10) / 10, market_relevance: relevance, reasons,
  };
}
