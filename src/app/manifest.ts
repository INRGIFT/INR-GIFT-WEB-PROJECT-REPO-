import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

/** Web app manifest built from the official brand library's PWA set (public/brand/pwa). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: `${SITE.slogan}. ${SITE.tagline}.`,
    start_url: '/',
    display: 'standalone',
    theme_color: '#071A33',
    background_color: '#071A33',
    icons: [
      { src: '/brand/pwa/INRGIFT_PWA_192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/pwa/INRGIFT_PWA_512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/pwa/INRGIFT_PWA_Maskable_192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/brand/pwa/INRGIFT_PWA_Maskable_512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
