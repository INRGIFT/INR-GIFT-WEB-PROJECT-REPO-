'use client';

/** Last-resort boundary when the root layout itself fails. Uses inline styles because global CSS may not have loaded. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: 'system-ui, sans-serif', color: '#071A33', background: '#F7F9FC', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <main style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22 }}>INRGIFT could not load</h1>
          <p style={{ color: '#4A5770' }}>Something failed before the page could render. Try again in a moment.</p>
          <button type="button" onClick={reset} style={{ marginTop: 12, height: 40, padding: '0 16px', borderRadius: 10, border: 0, background: '#245BFE', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
