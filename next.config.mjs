/** Security headers apply to every route. Private areas are additionally marked noindex in middleware. */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  async headers() { return [{ source: '/:path*', headers: securityHeaders }]; },
};
