import Link from 'next/link';
import { cn } from '@/lib/format';

/**
 * Official INRGIFT logo files (public/brand, from the brand asset library v1.0; see docs/BRAND_ASSET_INVENTORY.md).
 * Always the supplied artwork, never retyped or redrawn. Sizes follow the brand guidelines: desktop header horizontal
 * lockup at ≥220 px wide (its minimum), mobile header emblem at 36 px tall, footer horizontal at 280 px wide,
 * auth pages stacked lockup. `tone="dark"` selects the Reverse (white + cobalt) files for navy backgrounds.
 */
const ALT = 'INRGIFT — Invest Beyond Borders';
const FILES = {
  horizontal: { light: '/brand/web/INRGIFT_Web_Header_Desktop_Light.svg', dark: '/brand/web/INRGIFT_Web_Header_Desktop_Dark.svg', ratio: 7868.22 / 2012.41 },
  emblem: { light: '/brand/web/INRGIFT_Web_Header_Mobile_Light.svg', dark: '/brand/web/INRGIFT_Web_Header_Mobile_Dark.svg', ratio: 1789.59 / 2012.41 },
  stacked: { light: '/brand/web/INRGIFT_Web_Login.svg', dark: '/brand/web/INRGIFT_Web_Login_Dark.svg', ratio: 5623.4 / 4997.37 },
} as const;
type Lockup = keyof typeof FILES;

export function BrandMark({ lockup, tone = 'light', height, className, decorative }: { lockup: Lockup; tone?: 'light' | 'dark'; height: number; className?: string; decorative?: boolean }) {
  const f = FILES[lockup];
  // eslint-disable-next-line @next/next/no-img-element -- static SVG from /public; next/image adds nothing for vectors
  return <img src={f[tone]} alt={decorative ? '' : ALT} width={Math.round(height * f.ratio)} height={height} className={cn('block max-w-none select-none', className)} draggable={false} />;
}

/** Home link with the official logo: horizontal lockup from `lg`, emblem below (or always, with `compact`). */
export function Logo({ light, compact, className }: { light?: boolean; compact?: boolean; className?: string }) {
  const tone = light ? 'dark' : 'light';
  return (
    <Link href="/" aria-label="INRGIFT home" className={cn('flex shrink-0 items-center rounded-md', className)}>
      {compact ? <BrandMark lockup="emblem" tone={tone} height={36} decorative /> : (<>
        <BrandMark lockup="emblem" tone={tone} height={36} decorative className="lg:hidden" />
        <BrandMark lockup="horizontal" tone={tone} height={56} decorative className="hidden lg:block" />
      </>)}
    </Link>
  );
}
