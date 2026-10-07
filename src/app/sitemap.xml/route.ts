import { isIndexable } from '@/lib/config';
import { absoluteUrl } from '@/lib/seo';
import { SITEMAP_SECTIONS } from '../sitemap';

/** Sitemap index at /sitemap.xml pointing to the per-section files that src/app/sitemap.ts generates. */
export function GET() {
  const body = isIndexable
    ? SITEMAP_SECTIONS.map((s) => `<sitemap><loc>${absoluteUrl(`/sitemap/${s}.xml`)}</loc></sitemap>`).join('\n')
    : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
