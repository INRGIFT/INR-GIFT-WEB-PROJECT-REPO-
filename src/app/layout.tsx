import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/components/layout/providers';
import { config } from '@/lib/config';
import { fxRates } from '@/services/market-data';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: { default: 'INRGIFT · Global market intelligence from India', template: '%s · INRGIFT' },
  description: 'Every market. Every asset. One research view. Research global stocks, ETFs, indices and currencies with India context.',
  openGraph: { siteName: 'INRGIFT', type: 'website', title: 'INRGIFT · Global market intelligence from India', description: 'Every market. Every asset. One research view.' },
  alternates: { canonical: '/' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FFFFFF' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const rates = await fxRates();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" />
      </head>
      <body><Providers rates={rates}>{children}</Providers></body>
    </html>
  );
}
