import type { Metadata } from 'next';
import { isIndexablePath } from './route-registry';
import { config, publicPagesIndexable } from './config';

/**
 * Metadata engine. Every route builds its metadata here so canonical, Open Graph, Twitter and robots rules stay
 * consistent. Indexability rules (docs/SEO.md):
 *  - public content pages are indexable with a self-referencing canonical;
 *  - faceted, filtered or search states (`?region=`, `?category=`, screener `?q=`) canonicalise to the base page
 *    and are `noindex, follow` so crawl budget goes to the base page;
 *  - private, auth and workspace pages are `noindex, nofollow` (middleware adds the header as well).
 */
/** `slogan` is the approved brand tagline; it appears in the logo artwork and must not be reworded. */
export const SITE = { name: 'INRGIFT', slogan: 'Invest Beyond Borders', tagline: 'Global market intelligence from India', promise: 'Every market. Every asset. One research view.' };
export const absoluteUrl = (path: string) => new URL(path, config.siteUrl).toString();

interface PageMeta {
  title: string;
  description: string;
  /** Canonical path, e.g. `/stocks/AAPL`. */
  path: string;
  /** `faceted` keeps the canonical but asks crawlers not to index this variant. `private` blocks indexing and following. */
  index?: 'index' | 'faceted' | 'noindex' | 'private';
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  /** Absolute title: skips the "· INRGIFT" template. */
  absoluteTitle?: boolean;
  keywords?: string[];
}
export function pageMetadata({ title, description, path, index = 'index', type = 'website', publishedTime, modifiedTime, absoluteTitle, keywords }: PageMeta): Metadata {
  const ogTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: path },
    // Homepage demo values sit in data-nosnippet regions (src/features/home); SITE_INDEXABLE=false closes public pages too.
    // Only public pages may be indexed (src/lib/route-registry.ts); product pages require sign-in and are noindex.
    robots: !publicPagesIndexable || index === 'private' || !isIndexablePath(path.split('?')[0]) ? { index: false, follow: false } : index === 'faceted' || index === 'noindex' ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { type, title: ogTitle, description, url: path, siteName: SITE.name, locale: 'en_IN', ...(type === 'article' ? { publishedTime, modifiedTime } : {}) },
    twitter: { card: 'summary_large_image', title: ogTitle, description },
  };
}
export const privateMetadata = (title: string): Metadata => ({ title, robots: { index: false, follow: false } });
