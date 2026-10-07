import { absoluteUrl, SITE } from './seo';
import type { Asset, MarketView, ResearchDoc } from './types';

/**
 * Schema.org structured data. Every builder returns a plain object; <JsonLd> serialises it safely (escaping `<` so
 * content can never close the script tag). Demo prices are deliberately never emitted as structured offers or quotes.
 */
type Thing = Record<string, unknown>;
export function JsonLd({ data }: { data: Thing | Thing[] }) {
  const json = JSON.stringify(Array.isArray(data) ? { '@context': 'https://schema.org', '@graph': data } : { '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
export const organization = (): Thing => ({ '@type': 'Organization', '@id': absoluteUrl('/#organization'), name: SITE.name, url: absoluteUrl('/'), logo: absoluteUrl('/brand/logo/INRGIFT_Emblem_NavyCobalt_512.png'), slogan: SITE.slogan, description: `${SITE.tagline}. A research and information platform; not a broker or investment adviser.` });
export const website = (): Thing => ({ '@type': 'WebSite', '@id': absoluteUrl('/#website'), name: SITE.name, url: absoluteUrl('/'), publisher: { '@id': absoluteUrl('/#organization') }, inLanguage: 'en-IN', potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: absoluteUrl('/search?q={search_term_string}') }, 'query-input': 'required name=search_term_string' } });
export const breadcrumbs = (items: [string, string?][]): Thing => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(href ? { item: absoluteUrl(href) } : {}) })) });
export const article = (d: ResearchDoc, path: string): Thing => ({ '@type': 'Article', headline: d.title, description: d.summary, datePublished: d.publishedAt, dateModified: d.publishedAt, mainEntityOfPage: absoluteUrl(path), author: { '@type': 'Organization', name: `${SITE.name} Research` }, publisher: { '@id': absoluteUrl('/#organization') }, about: d.assetSymbol ? { '@type': 'Thing', name: d.assetSymbol } : d.topic, articleSection: d.kind, isAccessibleForFree: true });
/** Author is the INRGIFT Research desk as an Organization: content is never attributed to an invented person. */
export const learningResource = (a: { title: string; summary: string; slug: string; section: string; publishedAt?: string; updatedAt?: string; author?: string }, path: string): Thing => ({ '@type': 'Article', headline: a.title, description: a.summary, articleSection: a.section, mainEntityOfPage: absoluteUrl(path), publisher: { '@id': absoluteUrl('/#organization') }, author: { '@type': 'Organization', name: a.author ?? `${SITE.name} Research` }, ...(a.publishedAt ? { datePublished: a.publishedAt, dateModified: a.updatedAt ?? a.publishedAt } : {}), learningResourceType: 'Explainer', isAccessibleForFree: true });
export const definedTerm = (t: { term: string; definition: string }, path: string): Thing => ({ '@type': 'DefinedTerm', name: t.term, description: t.definition, url: absoluteUrl(path), inDefinedTermSet: { '@type': 'DefinedTermSet', name: `${SITE.name} glossary`, url: absoluteUrl('/resources/glossary') } });
export const definedTermSet = (terms: { term: string; definition: string; slug: string }[]): Thing => ({ '@type': 'DefinedTermSet', name: `${SITE.name} glossary`, url: absoluteUrl('/resources/glossary'), hasDefinedTerm: terms.map((t) => ({ '@type': 'DefinedTerm', name: t.term, description: t.definition, url: absoluteUrl(`/resources/glossary/${t.slug}`) })) });
export const faqPage = (items: { q: string; a: string }[]): Thing => ({ '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
/** Entity markup for an instrument: identity only (name, ticker, exchange, issuer), never a price. */
export function instrument(a: Asset, path: string): Thing {
  const base = { name: a.name, url: absoluteUrl(path), description: a.description };
  if (a.cls === 'stock' || a.cls === 'reit') return { '@type': 'Corporation', ...base, tickerSymbol: a.symbol, ...(a.sector ? { knowsAbout: a.sector } : {}), address: { '@type': 'PostalAddress', addressCountry: a.country } };
  if (a.cls === 'etf') return { '@type': 'InvestmentFund', ...base, ...(a.etf ? { provider: { '@type': 'Organization', name: a.etf.issuer } } : {}), ...(a.m.expenseRatio != null ? { feesAndCommissionsSpecification: `Expense ratio ${a.m.expenseRatio}% a year` } : {}) };
  if (a.cls === 'fx') return { '@type': 'ExchangeRateSpecification', currency: a.fx?.base, url: base.url, name: base.name };
  return { '@type': 'FinancialProduct', ...base, category: a.cls };
}
export const marketPlace = (m: MarketView, path: string): Thing => ({ '@type': 'Place', name: `${m.name} stock market`, url: absoluteUrl(path), address: { '@type': 'PostalAddress', addressCountry: m.countryCode }, containsPlace: m.exchanges.map((e) => ({ '@type': 'Organization', name: e.name, identifier: e.mic })) });
