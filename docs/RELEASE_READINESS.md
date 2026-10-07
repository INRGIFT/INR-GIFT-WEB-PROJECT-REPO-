# Release readiness (7 Oct 2026)

**Verdict: not ready for a public production launch.** The code builds and the test suites pass. That is
necessary, not sufficient. The product currently serves demo data, and several launch gates belong to the owner.

## Gates

| Gate | State | Owner |
| --- | --- | --- |
| Typecheck, unit/API tests (218), builds (no env, demo, demo with SMS on) | Pass | — |
| Migration 0008 (GIFT ID) applied alone to the live project; Supabase Email OTP length 6, expiry 3600 s | Open (`docs/DEPLOY.md`) | Owner |
| Real sign-up with the six-digit email code on the deployed site | Open; needs Resend + hook | Owner + engineering |
| Live `/login` uses Supabase (runtime settings fix) | Fixed in code; live site needs a redeploy of the new zip | Owner |
| Google provider in Google Cloud + Supabase | Open | Owner |
| Legal documents reviewed by counsel (registered entity, governing law) | Open | Owner |
| Public homepage market values: demo values labelled DEMO today; a licensed source shows prices to signed-out visitors only after `PUBLIC_MARKET_DATA=on` | Decide when the licence is known | Owner |
| NewsData.io terms for showing headlines (with publisher links) on the public homepage | Legal review open | Owner + counsel |
| Third-party notices: KLineChart LICENSE/NOTICE (its NOTICE credits TradingView Lightweight Charts, reproduced as text) on `/legal/open-source`; full licence scan of production dependencies | Notices in place; scan and legal review open | Engineering + counsel |
| Playwright (homepage, charts, access gate, compliance pages and forms, Google flow, session lifecycle, journeys, auth cases 1–15, axe, six widths, failure cases) | Pass on demo builds: SMS off 144 + 6 skipped, SMS on 148 + 2 skipped | — |
| Migrations + RLS (`npm run test:db`, incl. 0007 and 0008; and 0008 without 0007 with backfill) | Pass on local Postgres; live project on 0001–0006; **0007 deliberately not applied** until SMS is switched on; 0008 to be applied alone | Owner |
| GoDaddy source zip validated; clean extract → `npm ci` → `npm run build` → `npm start` on `PORT` serves pages, 404, API, health | Pass locally (simulated GoDaddy flow) | — |
| `NEXT_PUBLIC_SITE_URL=https://inrgift.com` in GoDaddy before the build (canonical, email links, redirects; a production build also defaults to it) | Open | Owner |
| GoDaddy runs the build step and has the memory for `next build` (DEPLOY.md, remaining GoDaddy questions) | Unverified on the real account | Owner |
| Domain, DNS, TLS and GoDaddy Node.js app created | Open | Owner |
| Host environment variables (Supabase URL and publishable key, `NEXT_PUBLIC_SITE_URL`, Logo.dev key) | Open | Owner |
| `NEXT_PUBLIC_AUTH_MODE` is **not** `demo` on the public host | Must verify at deploy | Owner + engineering |
| Supabase Site URL, redirect URLs, email templates, custom SMTP | Open; production email untested | Owner |
| 2Factor.in DLT approval, key + template; then 0007 + `NEXT_PUBLIC_SMS_SECOND_FACTOR=on`; real SMS received | Pending DLT; SMS off in production until then | Owner |
| Resend key + verified domain + Supabase Send Email Hook; real email received | Open; untested | Owner |
| NewsData.io key; real request filtered to market news | Open; untested | Owner |
| Real sign-up round trip on the deployed domain | Open | Engineering, after the items above |
| Live market data (NSE licence and credentials) | Open; site stays noindex until then | Owner |
| Lawyer-reviewed legal text and a named grievance officer | Open | Owner |
| Analytics vendor (under consent) and error-reporting vendor | Open; interfaces ready | Owner choice |
| Manual screen-reader pass, Safari and Firefox, Lighthouse | Not done | Engineering |
| Server-side alert job | Not built | Engineering |

## What a soft launch on demo data would mean
It would be possible to show the site to invited people with the "Demo data" label visible. robots.txt, the
sitemap index and page metadata keep every product page out of search engines; the homepage and compliance pages are
indexable, and the homepage's demo values carry the DEMO status inside `data-nosnippet` regions. Demo auth must be off, and sign-up should stay
closed until production email is verified.
