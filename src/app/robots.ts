import type { MetadataRoute } from 'next';
import { publicPagesIndexable } from '@/lib/config';
import { absoluteUrl } from '@/lib/seo';
import { PUBLIC_SITEMAP_PATHS } from './sitemap';

/**
 * Crawlers may fetch only the public pages (homepage and compliance pages); every other path requires sign-in
 * (src/lib/route-registry.ts) and is disallowed. "$" pins each path exactly; /legal/ covers the legal documents.
 */
export default function robots(): MetadataRoute.Robots {
  if (!publicPagesIndexable) return { rules: [{ userAgent: '*', disallow: '/' }] };
  const allow = PUBLIC_SITEMAP_PATHS.filter((p) => !p.startsWith('/legal/')).map((p) => `${p}$`).concat('/legal/');
  return { rules: [{ userAgent: '*', allow, disallow: '/' }], sitemap: absoluteUrl('/sitemap.xml'), host: absoluteUrl('/') };
}
