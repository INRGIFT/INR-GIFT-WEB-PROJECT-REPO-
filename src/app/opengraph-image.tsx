import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/seo';

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default social card: brand, promise and a stylised IST session rail. Pages without their own image use this. */
export default function OpenGraphImage() {
  const rows: [string, number, number][] = [['Japan', 5.5, 12], ['India', 9.25, 15.5], ['United Kingdom', 12.5, 21], ['United States', 19, 25.5]];
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', background: '#071A33', color: '#fff', padding: 72 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 40, fontWeight: 800 }}>
          <div style={{ display: 'flex', width: 56, height: 56, borderRadius: 14, background: '#245BFE', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 26, height: 26, borderRadius: 13, border: '5px solid #fff' }} /></div>
          {SITE.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 26, color: '#9DB7FF', fontWeight: 600 }}>{SITE.tagline}</div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08, marginTop: 12, maxWidth: 900 }}>{SITE.promise}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(([name, a, b]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 20, color: 'rgba(255,255,255,.75)' }}>
              <div style={{ width: 220 }}>{name}</div>
              <div style={{ display: 'flex', position: 'relative', width: 760, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.12)' }}><div style={{ position: 'absolute', left: (a / 24) * 760, width: ((Math.min(b, 24) - a) / 24) * 760, height: 12, borderRadius: 6, background: name === 'India' ? '#E8862A' : '#5B8BFF' }} /></div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
