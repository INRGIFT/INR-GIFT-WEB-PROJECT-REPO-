/** Security headers apply to every route. Private areas are additionally marked noindex in middleware. */
const securityHeaders = () => [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp() },
];
/**
 * Content Security Policy. Scripts and styles are first-party; 'unsafe-inline' is required by Next's inline hydration
 * and Tailwind's style attributes (a nonce-based policy is the next step, docs/AUTH-SECURITY.md). The only third
 * parties are Supabase (auth and data) and the Logo.dev image CDN. 'unsafe-eval' is allowed in development only.
 */
function csp() {
  const dev = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:", // logos (img.logo.dev) and publisher images on news cards
    "font-src 'self'",
    "media-src 'self'",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${dev ? ' ws:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Optional: NEXT_OUTPUT=standalone produces .next/standalone/server.js for a self-managed server. GoDaddy uses the
  // normal build from the source zip (npm run build, npm start; docs/DEPLOY.md).
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' } : {}),
  eslint: { ignoreDuringBuilds: true },
  async headers() { return [{ source: '/:path*', headers: securityHeaders() }]; },
  // Old legal and contact URLs move permanently to the canonical compliance URLs (no dead links). Redirects run before
  // middleware, so they work signed out.
  async redirects() {
    return [
      ['/legal/terms', '/terms-and-conditions'], ['/legal/privacy', '/privacy-policy'], ['/legal/grievance', '/grievance-redressal'],
      ['/legal/cookies', '/legal/cookie-policy'], ['/legal/risk-disclosure', '/legal/risk-disclaimer'], ['/legal/terms-and-conditions', '/terms-and-conditions'],
      ['/legal/privacy-policy', '/privacy-policy'], ['/contact', '/support'], ['/terms', '/terms-and-conditions'], ['/privacy', '/privacy-policy'],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};
