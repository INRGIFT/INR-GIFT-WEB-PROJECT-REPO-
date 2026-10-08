import { SOCIAL_TEXT_MAX, type SocialMedia, type SocialPlatform } from './social-types';

/** Post links: the platform itself, over https. Anything else from a provider is dropped, never rewritten. */
const PERMALINK_HOSTS: Record<SocialPlatform, RegExp> = { instagram: /^(www\.)?instagram\.com$/i, x: /^(www\.)?(x|twitter)\.com$/i };
/** Images and video thumbnails: the platforms' own CDNs over https. */
const MEDIA_HOSTS: Record<SocialPlatform, RegExp> = { instagram: /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i, x: /^(pbs|video)\.twimg\.com$/i };

const httpsOn = (u: unknown, hosts: RegExp): string | null => {
  if (typeof u !== 'string') return null;
  try { const x = new URL(u); return x.protocol === 'https:' && hosts.test(x.hostname) ? x.toString() : null; } catch { return null; }
};
export const safePermalink = (platform: SocialPlatform, u: unknown) => httpsOn(u, PERMALINK_HOSTS[platform]);
export const safeMedia = (platform: SocialPlatform, u: unknown, kind: SocialMedia['kind']): SocialMedia | null => { const url = httpsOn(u, MEDIA_HOSTS[platform]); return url ? { kind, url } : null; };
/** Plain text for a card: whitespace collapsed, cut at a word boundary with an ellipsis. Never invented or rewritten. */
export function shortText(t: unknown): string | null {
  if (typeof t !== 'string') return null;
  const s = t.replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (s.length <= SOCIAL_TEXT_MAX) return s;
  const cut = s.slice(0, SOCIAL_TEXT_MAX);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 120 ? cut.lastIndexOf(' ') : SOCIAL_TEXT_MAX).trimEnd()}…`;
}
/** Provider timestamps ("2026-10-05T12:34:56+0000", "2026-10-05T12:34:56.000Z") → ISO UTC, or null. */
export function isoTime(t: unknown): string | null {
  if (typeof t !== 'string') return null;
  const d = new Date(t.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export const byNewest = <T extends { published_at: string | null }>(a: T, b: T) => (b.published_at ?? '').localeCompare(a.published_at ?? '');
