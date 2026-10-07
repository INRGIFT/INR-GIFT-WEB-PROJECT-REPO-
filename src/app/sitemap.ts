import type { MetadataRoute } from 'next';
import { isIndexable } from '@/lib/config';
import { absoluteUrl } from '@/lib/seo';
import { getLegalDocs } from '@/services/content';

/**
 * Sitemap of public pages only (served at /sitemap/core.xml, indexed by /sitemap.xml). Product pages require sign-in
 * and are never listed. Empty while the site serves demo data, like robots.txt.
 */
export const SITEMAP_SECTIONS = ['core'] as const;
export async function generateSitemaps() { return SITEMAP_SECTIONS.map((id) => ({ id })); }
type Entry = MetadataRoute.Sitemap[number];
const u = (path: string, priority: number, changeFrequency: Entry['changeFrequency']): Entry => ({ url: absoluteUrl(path), priority, changeFrequency });

export default async function sitemap({ id }: { id: (typeof SITEMAP_SECTIONS)[number] }): Promise<MetadataRoute.Sitemap> {
  if (!isIndexable || id !== 'core') return [];
  return [u('/', 1, 'weekly'), u('/support', 0.3, 'monthly'), u('/contact', 0.3, 'monthly'), ...(await getLegalDocs()).map((d) => u(`/legal/${d.slug}`, 0.2, 'yearly'))];
}
