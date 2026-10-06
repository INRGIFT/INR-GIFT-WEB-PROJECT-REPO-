import type { MetadataRoute } from 'next';
import { isIndexable } from '@/lib/config';
import { absoluteUrl } from '@/lib/seo';

/** Private, auth, API and search routes are never crawled. The whole site is closed while it serves demo data. */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/app', '/account', '/notifications', '/onboarding', '/login', '/signup', '/verify', '/verify-phone', '/mfa', '/forgot-password', '/reset-password', '/auth/', '/search'] }],
    sitemap: ['core', 'markets', 'assets', 'research', 'resources'].map((s) => absoluteUrl(`/sitemap/${s}.xml`)),
    host: absoluteUrl('/'),
  };
}
