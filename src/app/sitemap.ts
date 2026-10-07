import type { MetadataRoute } from 'next';
import { LEGAL_PATHS } from '@/lib/company';
import { publicPagesIndexable } from '@/lib/config';
import { absoluteUrl } from '@/lib/seo';

/**
 * Sitemap of the public pages only (served at /sitemap/core.xml, indexed by /sitemap.xml): the homepage and the
 * compliance pages. Every product page requires sign-in and is never listed.
 */
export const SITEMAP_SECTIONS = ['core'] as const;
export async function generateSitemaps() { return SITEMAP_SECTIONS.map((id) => ({ id })); }
type Entry = MetadataRoute.Sitemap[number];
const u = (path: string, priority: number, changeFrequency: Entry['changeFrequency']): Entry => ({ url: absoluteUrl(path), priority, changeFrequency });
export const PUBLIC_SITEMAP_PATHS = ['/', LEGAL_PATHS.about, LEGAL_PATHS.support, LEGAL_PATHS.terms, LEGAL_PATHS.privacy, LEGAL_PATHS.accountClosure, LEGAL_PATHS.grievance, LEGAL_PATHS.legal, LEGAL_PATHS.risk, LEGAL_PATHS.cookies];

export default async function sitemap({ id }: { id: (typeof SITEMAP_SECTIONS)[number] }): Promise<MetadataRoute.Sitemap> {
  if (!publicPagesIndexable || id !== 'core') return [];
  return PUBLIC_SITEMAP_PATHS.map((p) => u(p, p === '/' ? 1 : 0.5, p === '/' ? 'weekly' : 'monthly'));
}
