import { ADDRESS_ONE_LINE, COMPANY, LEGAL_PATHS } from '@/lib/company';

/**
 * INRGIFT legal documents (CMS-shaped; read only through src/services/content.ts). Written for what INRGIFT actually
 * is: a research, data and discovery platform. It does not execute transactions, hold funds or give personalised
 * advice, so nothing here describes trading, deposits or advisory services. Statements that need the company's legal
 * details that have not been supplied (registered entity name, governing law) are drafted neutrally rather than
 * invented. Have these documents reviewed by counsel; update `LEGAL_UPDATED` whenever a document changes.
 */
export interface LegalSection { heading: string; paragraphs?: string[]; list?: string[] }
export interface LegalDocument { slug: string; path: string; title: string; summary: string; sections: LegalSection[] }

/** The date these documents were last changed (they were written and published on this date). */
export const LEGAL_UPDATED = '2026-10-07';

const CONTACT: LegalSection = {
  heading: 'Contact us',
  paragraphs: [
    `Email: ${COMPANY.supportEmail}`,
    `Address: ${ADDRESS_ONE_LINE}`,
    `For a complaint, use the grievance process at ${COMPANY.site}${LEGAL_PATHS.grievance}.`,
  ],
};

const TERMS: LegalDocument = {
  slug: 'terms-and-conditions',
  path: LEGAL_PATHS.terms,
  title: 'Terms and Conditions',
  summary: 'The terms that apply when you use INRGIFT, a global market research and intelligence platform.',
  sections: [
    { heading: '1. Introduction and acceptance', paragraphs: [
      `These Terms and Conditions (the “Terms”) govern your access to and use of the INRGIFT website at ${COMPANY.site} and its related services (together, the “Service”), operated by INRGIFT (“INRGIFT”, “we”, “us”).`,
      'By creating an account, signing in or otherwise using the Service, you agree to these Terms and to our Privacy Policy. If you do not agree, do not use the Service.',
    ] },
    { heading: '2. What INRGIFT is', paragraphs: [
      'INRGIFT is a research, data, discovery and market-intelligence platform. It helps you search, discover, screen, compare, research and visualise information about markets and financial instruments, and to save watchlists, notes and alerts for your own research.',
      'INRGIFT is not a stock broker, exchange, depository participant, investment adviser, research analyst offering personalised recommendations, portfolio manager or trading platform. The Service does not place, route or execute orders, does not hold client money or securities, and does not accept deposits or make payments on your behalf. Alerts notify you only; they never act for you.',
    ] },
    { heading: '3. Information only, not advice', paragraphs: [
      'Everything on the Service — data, charts, screens, comparisons, research notes, news, glossary and learning content — is provided for general information and research. It is not investment, financial, legal, tax or accounting advice, and it is not an offer, solicitation or recommendation to buy, sell or hold any security or other instrument.',
      'Content does not take account of your objectives, financial situation or needs. You are solely responsible for your decisions. Consider seeking advice from a suitably qualified and registered professional before acting.',
      'INRGIFT does not guarantee any investment result. Past performance does not indicate future results, and the value of investments can fall as well as rise. See the Risk Disclaimer for more.',
    ] },
    { heading: '4. Eligibility', paragraphs: [
      'You must be at least 18 years old and able to enter into a binding contract under the law that applies to you. You must not use the Service where doing so is prohibited by law.',
    ] },
    { heading: '5. Your account', paragraphs: [
      'An INRGIFT account requires an email address, a mobile number and a password. You may also sign in with Google; an account created that way completes the same details before it can be used. You must give accurate information and keep it up to date.',
      'You are responsible for keeping your credentials confidential and for all activity under your account. Tell us at once at the address below if you suspect unauthorised access. We may add further verification steps, such as a code sent by SMS, to protect accounts.',
    ] },
    { heading: '6. Acceptable use', paragraphs: ['You agree to use the Service only for lawful, personal research purposes. You must not:'], list: [
      'copy, scrape, crawl, harvest, resell, redistribute, sublicense or publicly display data or content from the Service, except where a feature expressly allows sharing;',
      'use automated means to access the Service, other than as we expressly permit;',
      'attempt to bypass, probe or interfere with access controls, rate limits, security or the integrity of the Service;',
      'upload or send malicious code, spam or unlawful, misleading or infringing material;',
      'impersonate any person, misrepresent your identity, or use another person’s account;',
      'use the Service to manipulate markets, spread false or misleading information, or breach any applicable law or regulation.',
    ] },
    { heading: '7. Market data and its limitations', paragraphs: [
      'Market data, prices, fundamentals, calendars and other figures come from third-party sources or are derived from them. They may be delayed, end-of-day, incomplete, revised or unavailable, and may contain errors. Some environments use clearly labelled demonstration data rather than live data.',
      'Each data module shows its status (for example Live, Delayed, End of day, Closed, Unavailable, Stale or Error) and a timestamp. Read that status before relying on a figure, and verify important information with the issuer, exchange or another authoritative source.',
    ] },
    { heading: '8. Third-party providers, links and news', paragraphs: [
      'The Service relies on third-party providers (for example for hosting, authentication, email, news and data). Their services may change or be interrupted, and their own terms may apply.',
      'News headlines and summaries are supplied by third-party publishers and aggregators and are shown with their source and a link to the original. INRGIFT does not write or endorse third-party news and is not responsible for its accuracy. Links to other websites are provided for convenience; we do not control and are not responsible for those websites.',
    ] },
    { heading: '9. Intellectual property', paragraphs: [
      'The Service, its software, design, text, graphics, logos and the INRGIFT name and marks belong to INRGIFT or its licensors and are protected by law. Third-party data and content remain the property of their owners.',
      'We grant you a limited, personal, non-exclusive, non-transferable, revocable licence to use the Service for your own research in line with these Terms. No other right is granted.',
    ] },
    { heading: '10. Your content', paragraphs: [
      'Watchlists, notes, saved screens, comparisons, collections and alerts you create remain yours. You give us permission to store and process them only to provide the Service to you. They are private to your account. You are responsible for what you save and must not store unlawful material.',
    ] },
    { heading: '11. Availability, maintenance and changes to the Service', paragraphs: [
      'We aim to keep the Service available but do not guarantee uninterrupted or error-free operation. We may carry out maintenance, and we may change, suspend or discontinue features at any time. Where reasonably possible we will give notice of significant changes.',
    ] },
    { heading: '12. Suspension and termination', paragraphs: [
      'We may suspend or terminate access to the Service, with or without notice, if you breach these Terms, if required by law, or to protect the Service, other users or INRGIFT.',
      `You may stop using the Service at any time. To close your account, follow the process at ${COMPANY.site}${LEGAL_PATHS.accountClosure}. Sections that by their nature should survive termination (including intellectual property, disclaimers, limitation of liability and indemnity) continue to apply.`,
    ] },
    { heading: '13. Disclaimers', paragraphs: [
      'To the fullest extent permitted by law, the Service and all content are provided “as is” and “as available”, without warranties of any kind, express or implied, including accuracy, completeness, timeliness, merchantability, fitness for a particular purpose and non-infringement.',
    ] },
    { heading: '14. Limitation of liability', paragraphs: [
      'To the fullest extent permitted by law, INRGIFT and its officers, employees and providers are not liable for any indirect, incidental, special, consequential or punitive loss, or for any loss of profits, revenue, data, goodwill or investment value, arising from or related to your use of, or inability to use, the Service or any content, including any decision made in reliance on it.',
      'Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law.',
    ] },
    { heading: '15. Indemnity', paragraphs: [
      'To the extent permitted by law, you agree to indemnify INRGIFT against claims, losses and reasonable costs arising from your breach of these Terms or your misuse of the Service.',
    ] },
    { heading: '16. Changes to these Terms', paragraphs: [
      'We may update these Terms from time to time. The “Last updated” date shows when they last changed. If a change is material we will take reasonable steps to tell you, for example by a notice on the Service or by email. Continuing to use the Service after a change means you accept the updated Terms.',
    ] },
    { heading: '17. Governing law and disputes', paragraphs: [
      'These Terms are governed by the law that applies to INRGIFT’s operation of the Service, without regard to conflict-of-law rules. Before starting any formal proceedings, please contact us so that we can try to resolve the matter through the grievance process. Nothing in this section limits rights you have under mandatory consumer-protection law.',
    ] },
    { heading: '18. General', paragraphs: [
      'If any part of these Terms is found unenforceable, the rest remains in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent. These Terms, together with the Privacy Policy and the documents they refer to, are the entire agreement between you and INRGIFT about the Service.',
    ] },
    CONTACT,
  ],
};

const PRIVACY: LegalDocument = {
  slug: 'privacy-policy',
  path: LEGAL_PATHS.privacy,
  title: 'Privacy Policy',
  summary: 'What personal information INRGIFT collects, why, who processes it and the choices you have.',
  sections: [
    { heading: '1. Who we are', paragraphs: [
      `This Privacy Policy explains how INRGIFT (“we”, “us”) handles personal information when you use ${COMPANY.site} (the “Service”). INRGIFT is a market research and intelligence platform; it does not execute transactions or hold funds.`,
      `Questions or requests: ${COMPANY.supportEmail}, ${ADDRESS_ONE_LINE}.`,
    ] },
    { heading: '2. Information you give us', list: [
      'Account details: your name, email address, mobile number, country of residence and password. Passwords are handled by our authentication provider and stored only as a secure hash; INRGIFT staff never see them.',
      'If you sign in with Google: your name, email address and the fact that Google verified that email, as shared by Google through our authentication provider. We do not receive your Google password.',
      'Your research: watchlists, alerts, notes, saved screens, comparisons, collections and preferences you choose to save.',
      'Support requests, grievances and account-closure requests: your name, email, phone number if you give it, the subject, category and message, and any reference you include.',
    ] },
    { heading: '3. Information collected automatically', list: [
      'Authentication and session information: sign-in method, session identifiers and timestamps needed to keep you signed in and to protect your account.',
      'Security and technical logs: IP address, browser type, request times and error details, used for security, abuse prevention (including rate limiting) and keeping the Service working.',
      'Usage analytics, only if you allow it: anonymous, typed product events (never free text, email addresses or account identifiers). No analytics provider currently receives these events.',
      'Data and news requests: the instruments, markets and news topics you open, processed to return results to you.',
    ] },
    { heading: '4. Verification', paragraphs: [
      'We verify your email address before an account can be used. SMS verification of your mobile number is planned; when it is switched on, a one-time code will be sent to your number at sign-in through our SMS provider. We store only an opaque reference to each code, never the code itself.',
    ] },
    { heading: '5. How we use information', list: [
      'to create and secure your account, verify your email (and, when activated, your mobile number) and keep you signed in;',
      'to provide the Service, including showing your saved research and sending the alerts you create;',
      'to send service emails, such as confirmation, password reset and security notices;',
      'to answer support requests, grievances and account-closure requests;',
      'to detect, prevent and investigate fraud, abuse and security incidents;',
      'to comply with legal obligations and enforce our Terms.',
    ] },
    { heading: '6. What we do not do', paragraphs: [
      'We do not sell your personal information. We do not use it for third-party advertising. We do not set third-party advertising cookies.',
    ] },
    { heading: '7. Service providers', paragraphs: ['We share personal information only with providers that process it for us to run the Service:'], list: [
      'Supabase — authentication, sessions and the database that stores your account and saved research.',
      'Resend — delivery of service emails and of the support, grievance and account-closure messages you send us.',
      'Google — only if you choose “Continue with Google”, to sign you in.',
      'NewsData.io — supplies news content; your requests for news are made by our server and do not include your personal details.',
      '2Factor.in — SMS verification codes, only once SMS verification is activated.',
      'Our hosting provider — runs the website and processes request data such as IP addresses.',
    ] },
    { heading: '8. Where information is processed', paragraphs: [
      'Our providers may process information on servers outside your country of residence. We use providers that apply appropriate security measures, and we share only what each needs.',
    ] },
    { heading: '9. Security', paragraphs: [
      'We use encryption in transit (HTTPS), hashed passwords, access controls that make your saved research readable only by your account, server-only handling of provider credentials, rate limits and security logging. No system is perfectly secure; please use a strong, unique password and tell us at once about any suspected misuse.',
    ] },
    { heading: '10. Retention', paragraphs: [
      'We keep account information and saved research while your account is open. After an account is closed we delete or anonymise personal information within a reasonable period, except where we must keep some information to meet legal obligations, resolve disputes, prevent fraud or enforce our agreements. Support, grievance and closure correspondence is kept as long as needed to handle the request and any follow-up.',
    ] },
    { heading: '11. Your rights and choices', list: [
      'Access and correction: you can view and edit your profile in your account; ask us for a copy of other information we hold.',
      'Deletion: you can delete saved research in the workspace, and request closure of your account at the Account Closure page.',
      'Analytics: you can allow or refuse analytics at any time in the Cookie Policy or your account settings.',
      'Withdrawal and complaints: you can withdraw consent where processing relies on it, and raise a concern through the grievance process.',
    ] },
    { heading: '12. Cookies and local storage', paragraphs: [
      `We use essential cookies to keep you signed in and browser storage for preferences. Details are in the Cookie Policy at ${COMPANY.site}${LEGAL_PATHS.cookies}.`,
    ] },
    { heading: '13. Children', paragraphs: ['The Service is not intended for anyone under 18, and we do not knowingly collect their personal information.'] },
    { heading: '14. Changes to this policy', paragraphs: ['We may update this policy. The “Last updated” date shows when it last changed; material changes will be highlighted on the Service or sent by email.'] },
    CONTACT,
  ],
};

const RISK: LegalDocument = {
  slug: 'risk-disclaimer',
  path: LEGAL_PATHS.risk,
  title: 'Risk and Research Disclaimer',
  summary: 'INRGIFT is a research and intelligence platform. It does not give advice or guarantee any outcome.',
  sections: [
    { heading: 'Research and information only', paragraphs: [
      'INRGIFT provides market data, research tools and educational content for information. Nothing on INRGIFT is investment, financial, legal or tax advice, or a recommendation or offer to buy, sell or hold any security, fund, currency, commodity or other instrument. INRGIFT does not provide regulated advisory, portfolio-management or brokerage services.',
    ] },
    { heading: 'No guarantee of outcomes', paragraphs: [
      'Investing involves risk, including the possible loss of the money you invest. Past performance, back-tested figures and historical comparisons do not indicate or guarantee future results. Screens, rankings, heatmaps and comparisons describe data; they do not predict returns.',
    ] },
    { heading: 'Market, liquidity and volatility risk', paragraphs: ['Prices can move quickly and unpredictably. Some instruments trade thinly, which can make prices less reliable and harder to act on.'] },
    { heading: 'Currency risk', paragraphs: ['Returns on foreign assets depend on exchange rates as well as asset prices. Rupee values shown on INRGIFT are converted at the stated rate and are approximate.'] },
    { heading: 'Data risk', paragraphs: [
      'Data may be delayed, end-of-day, demonstration data, incomplete or wrong. Each module shows its status and timestamp. Verify important figures with the issuer, the exchange or another authoritative source before relying on them.',
    ] },
    { heading: 'International markets', paragraphs: ['Rules on investing in foreign markets, including limits and reporting duties, depend on where you live. Check what applies to you before investing outside your home market.'] },
    { heading: 'Your responsibility', paragraphs: ['You are solely responsible for your investment decisions. Consider your objectives and circumstances and, where appropriate, consult a suitably qualified and registered professional.'] },
    CONTACT,
  ],
};

const COOKIES: LegalDocument = {
  slug: 'cookie-policy',
  path: LEGAL_PATHS.cookies,
  title: 'Cookie and Tracking Notice',
  summary: 'The cookies and browser storage INRGIFT uses, and your analytics choice.',
  sections: [
    { heading: 'Essential cookies', paragraphs: [
      'When you sign in, our authentication provider (Supabase) sets cookies whose names begin with “sb-”. They keep you signed in and protect your session. The Service cannot work without them, so they do not need consent. They are removed when you sign out or when the session expires.',
    ] },
    { heading: 'Browser storage', paragraphs: ['INRGIFT stores a few items in your browser’s local or session storage. They stay on your device:'], list: [
      'your analytics choice (allowed or refused);',
      'display preferences, such as currency, before you sign in;',
      'recent searches, the assets you selected to compare, and whether the sidebar is collapsed;',
      'during sign-in, a short-lived reference to a pending verification step (never a code or password).',
    ] },
    { heading: 'Analytics', paragraphs: [
      'Product analytics are off unless you allow them. When allowed, INRGIFT records anonymous, typed events (for example that a screen was saved), never free text, email addresses or account identifiers. No analytics provider currently receives these events. You can change your choice below at any time.',
    ] },
    { heading: 'Advertising', paragraphs: ['INRGIFT does not use advertising or cross-site tracking cookies.'] },
    { heading: 'Managing cookies', paragraphs: ['You can delete cookies and site data in your browser settings. Deleting the essential cookies signs you out.'] },
    CONTACT,
  ],
};

const REFUND: LegalDocument = {
  slug: 'refund',
  path: '/legal/refund',
  title: 'Refund Policy',
  summary: 'INRGIFT is free today, so there are no charges to refund.',
  sections: [
    { heading: 'Current plans', paragraphs: ['INRGIFT is free today, so there are no charges to refund.'] },
    { heading: 'Future paid plans', paragraphs: ['Refund terms for any paid plan will be published here before that plan is offered.'] },
    CONTACT,
  ],
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [TERMS, PRIVACY, RISK, COOKIES, REFUND];
