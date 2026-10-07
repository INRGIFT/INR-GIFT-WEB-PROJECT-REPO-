import type { MetadataRoute } from 'next';
import { isIndexable } from '@/lib/config';
import { absoluteUrl } from '@/lib/seo';

/**
 * Only the homepage and the public pages (legal, support, contact) may be crawled; every product page requires
 * sign-in (src/lib/route-registry.ts) and is disallowed. While the site serves demo data everything is closed.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: ['/$', '/legal/', '/support$', '/contact$'], disallow: '/' }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
