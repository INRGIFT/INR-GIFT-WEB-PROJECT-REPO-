/**
 * Posts from INRGIFT's two official accounts (src/lib/company.ts → COMPANY.social), as returned by the platforms'
 * official APIs. Every field is the provider's own value or null when the provider did not return it: nothing here is
 * written by INRGIFT, and no engagement figures (likes, views, comments) are read or shown.
 */
export type SocialPlatform = 'instagram' | 'x';
export interface SocialMedia { kind: 'image' | 'video'; url: string }
export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  /** The account handle the provider returned (without "@"), else null. */
  author: string | null;
  /** When the post was published (ISO, UTC), from the provider; null if it gave none. */
  published_at: string | null;
  /** The post text, shortened for a card (see SOCIAL_TEXT_MAX); null if the post has none. */
  text: string | null;
  /** A still image for the card: the image itself, or a video's thumbnail. Only from trusted platform CDNs. */
  media: SocialMedia | null;
  /** The post on the platform (instagram.com or x.com only). */
  permalink: string;
  fetched_at: string;
}
export type SocialStatus = 'FRESH' | 'CACHED' | 'STALE' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
export interface SocialFeed {
  platform: SocialPlatform;
  status: SocialStatus;
  /** Newest first, by the provider's publish time. */
  posts: SocialPost[];
  retrievedAt: string | null;
  notice?: string;
}
export const SOCIAL_TEXT_MAX = 220;
