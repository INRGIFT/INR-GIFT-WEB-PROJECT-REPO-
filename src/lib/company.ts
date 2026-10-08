/**
 * INRGIFT's published company and support details (owner-supplied, 7 Oct 2026). One source for the footer, About,
 * Support, Grievance Redressal, Account Closure and the legal documents. No phone number is published unless
 * SUPPORT_PHONE is configured on the server (src/lib/company-server.ts); none is invented here.
 */
export const COMPANY = {
  name: 'INRGIFT',
  descriptor: 'Global market intelligence from India',
  tagline: 'Invest Beyond Borders',
  promise: 'Every market. Every asset. One research view.',
  workflow: ['Search', 'Discover', 'Screen', 'Compare', 'Research', 'Visualize', 'Save', 'Watch', 'Alert'],
  supportEmail: 'support@inrgift.com',
  address: ['904 WHITE ORCHID', 'near SHELL PETROL PUMP', 'Adajan', 'Surat, Gujarat 395009', 'India'],
  site: 'https://inrgift.com',
  /**
   * INRGIFT's official social profiles (owner-supplied, exact URLs). Only these two exist; no other network is linked.
   * Display text is fixed by the owner: "Instagram @inrgift" and "X @INRGIFT".
   */
  social: [
    { network: 'Instagram', handle: '@inrgift', label: 'Instagram @inrgift', href: 'https://www.instagram.com/inrgift?stkn=MTcxcnZ6enJuMnI1bQ==' },
    { network: 'X', handle: '@INRGIFT', label: 'X @INRGIFT', href: 'https://x.com/INRGIFT' },
  ],
} as const;
export const ADDRESS_ONE_LINE = COMPANY.address.join(', ');
/** The compliance URLs referenced by the NSEIXGA white-label documentation. Never change these paths. */
export const LEGAL_PATHS = {
  terms: '/terms-and-conditions',
  privacy: '/privacy-policy',
  about: '/about',
  support: '/support',
  accountClosure: '/account-closure',
  grievance: '/grievance-redressal',
  legal: '/legal',
  risk: '/legal/risk-disclaimer',
  cookies: '/legal/cookie-policy',
  openSource: '/legal/open-source',
} as const;
