'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/format';
import { fallbackLogo, logoFailed, logoUrl, markLogoFailed } from '@/lib/logos';
import type { Asset } from '@/lib/types';

/**
 * Issuer logo over a ticker tile. The tile is always rendered; the image sits on top and is removed if it fails,
 * so a missing logo never shows a broken-image icon. Decorative: the asset name is always next to it.
 */
export function AssetLogo({ asset, size = 36, className }: { asset: Pick<Asset, 'symbol' | 'name' | 'mic' | 'cls'>; size?: number; className?: string }) {
  const src = logoUrl(asset, { size: size <= 40 ? 64 : 128 });
  const [broken, setBroken] = useState(() => (src ? logoFailed(src) : true));
  const img = useRef<HTMLImageElement>(null);
  // An image that failed before hydration never fires React's onError; catch it on mount.
  useEffect(() => { const el = img.current; if (src && el?.complete && el.naturalWidth === 0) { markLogoFailed(src); setBroken(true); } }, [src]);
  const fail = () => { if (src) markLogoFailed(src); setBroken(true); };
  const tile = fallbackLogo(asset);
  return (
    <span className={cn('relative flex shrink-0 items-center justify-center overflow-hidden bg-hover font-display font-bold text-slate2', className)} style={{ width: size, height: size }}>
      <span aria-hidden>{tile.text}</span>
      {src && !broken && (
        // eslint-disable-next-line @next/next/no-img-element -- loaded straight from the logo CDN; not proxied or stored
        <img ref={img} src={src} alt="" width={size} height={size} loading="lazy" decoding="async" data-logo
          className="absolute inset-0 h-full w-full bg-white object-contain"
          onError={fail} />
      )}
    </span>
  );
}
