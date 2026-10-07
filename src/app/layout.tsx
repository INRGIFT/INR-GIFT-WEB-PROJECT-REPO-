import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/components/layout/providers';
import { config } from '@/lib/config';
import { SITE } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: { default: `${SITE.name} | ${SITE.slogan} · ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: `${SITE.promise} Research global stocks, ETFs, indices and currencies with India context.`,
  applicationName: SITE.name,
  openGraph: { siteName: SITE.name, type: 'website', locale: 'en_IN', title: `${SITE.name} · ${SITE.tagline}`, description: SITE.promise },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FFFFFF' };

/**
 * Every page renders per request: product pages depend on the visitor's session and must never be served from a
 * static or shared cache (dynamic responses carry Cache-Control: private, no-store).
 */
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
