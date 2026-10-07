# Release readiness (7 Oct 2026)

**Verdict: not ready for a public production launch.** The code builds and the test suites pass. That is
necessary, not sufficient. The product currently serves demo data, and several launch gates belong to the owner.

## Gates

| Gate | State | Owner |
| --- | --- | --- |
| Typecheck, unit/API tests (51), build | Pass | — |
| Playwright (64: journeys, routes, 404s, axe, six widths, reduced motion, failure cases) | Pass, demo mode | — |
| Migrations + RLS (`npm run test:db`) | Pass on local Postgres; live project on 0001–0006 | — |
| GoDaddy source zip validated; clean extract → `npm ci` → `npm run build` → `npm start` on `PORT` serves pages, 404, API, health | Pass locally (simulated GoDaddy flow) | — |
| `NEXT_PUBLIC_SITE_URL` set in GoDaddy before the build (canonical and share URLs) | Open, needs the domain | Owner |
| GoDaddy runs the build step and has the memory for `next build` (DEPLOY.md, remaining GoDaddy questions) | Unverified on the real account | Owner |
| Domain, DNS, TLS and GoDaddy Node.js app created | Open | Owner |
| Host environment variables (Supabase URL and publishable key, `NEXT_PUBLIC_SITE_URL`, Logo.dev key) | Open | Owner |
| `NEXT_PUBLIC_AUTH_MODE` is **not** `demo` on the public host | Must verify at deploy | Owner + engineering |
| Supabase Site URL, redirect URLs, email templates, custom SMTP | Open; production email untested | Owner |
| SMS provider for phone OTP | Open; untested | Owner |
| Real sign-up round trip on the deployed domain | Open | Engineering, after the items above |
| Live market data (NSE licence and credentials) | Open; site stays noindex until then | Owner |
| Lawyer-reviewed legal text and a named grievance officer | Open | Owner |
| Analytics vendor (under consent) and error-reporting vendor | Open; interfaces ready | Owner choice |
| Manual screen-reader pass, Safari and Firefox, Lighthouse | Not done | Engineering |
| Server-side alert job | Not built | Engineering |

## What a soft launch on demo data would mean
It would be possible to show the site to invited people with the "Demo data" label visible. robots.txt, the
sitemap index and page metadata keep it out of search engines. Demo auth must be off, and sign-up should stay
closed until production email is verified.
