/**
 * CMS-ready content model for INRGIFT's educational library.
 * Plain types with no runtime dependencies, so a headless CMS can later supply the same shapes.
 */

export type ContentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'UPDATED' | 'ARCHIVED';

export type ContentType =
  | 'article'
  | 'research_note'
  | 'research_report'
  | 'guide'
  | 'glossary_term'
  | 'market_profile'
  | 'country_profile'
  | 'exchange_profile'
  | 'theme'
  | 'sector'
  | 'industry'
  | 'collection'
  | 'news_item'
  | 'calendar_event'
  | 'video'
  | 'author'
  | 'methodology'
  | 'data_source';

export interface ContentMeta {
  status: ContentStatus;
  publishedAt: string;
  updatedAt: string;
  author: string;
  reviewer: string | null;
}

export interface ContentLink {
  label: string;
  href: string;
}

export interface LearnSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
  example?: string;
}

export interface LearnArticle extends ContentMeta {
  type: 'guide' | 'methodology' | 'article';
  slug: string;
  section: string;
  title: string;
  summary: string;
  keyPoints: string[];
  sections: LearnSection[];
  related: ContentLink[];
  /** Glossary term slugs. */
  glossary: string[];
}

export interface GlossaryTerm extends ContentMeta {
  type: 'glossary_term';
  slug: string;
  term: string;
  aliases?: string[];
  definition: string;
  plain: string;
  formula?: string;
  example: string;
  why: string;
  limitations: string;
  /** Other glossary term slugs. */
  related: string[];
  pages: ContentLink[];
}

/** True for content that may be shown publicly. */
export const PUBLISHED_ONLY = (s: ContentStatus): boolean => s === 'PUBLISHED' || s === 'UPDATED';
