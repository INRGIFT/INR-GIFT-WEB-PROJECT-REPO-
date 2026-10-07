# INRGIFT — instructions for Claude Code

INRGIFT is a **global market research and intelligence web app, built from India**. This repository is the
single source of truth. Continue it; do not restart it, re-scaffold it, or introduce a second architecture.

## Non-negotiable product rule

INRGIFT is **research only**. It is not a broker and not a trading app. Never add, name, route, stub or imply:
portfolio, holdings, P&L, orders, positions, buy/sell, brokerage, execution, deposits, withdrawals, account or
cash balances. No such table, type, component, nav item, CTA or copy. Alerts notify; they never place orders.
`tests/smoke.test.ts` asserts the provider payload contains none of these words. Keep that test.

## Read before changing anything

| Topic | File |
| --- | --- |
| What is built, what is not, what to do next | `docs/ROADMAP.md` |
| Product, positioning, scope | `docs/PRODUCT.md` |
| Tokens, type, components | `docs/DESIGN-SYSTEM.md` |
| IA, routes, flows, states, responsive | `docs/UX-SYSTEM.md` |
| Layers, folders, provider swap | `docs/ARCHITECTURE.md`, `docs/PROVIDERS.md` |
| External services (NSE, Supabase, logos, email, domain) | `docs/CONNECTORS.md` |
| Types and SQL schema | `docs/DATA-MODEL.md` |
| `/api/v1` contract | `docs/API-CONTRACT.md` |
| Supabase auth, RLS, security | `docs/AUTH-SECURITY.md` |
| SEO, copy, motion, media, QA | `docs/SEO.md`, `docs/CONTENT.md`, `docs/MOTION.md`, `docs/MEDIA.md`, `docs/QA.md` |
| Original briefs and the v1 HTML prototype | `docs/reference/` |

## Commands

```bash
npm install
npm run dev          # http://localhost:3000, runs with no env vars (demo data + demo auth)
npm run typecheck    # must pass before every commit
npm test             # vitest
npm run test:db      # all migrations + RLS tests on a throwaway local Postgres
npm run package:godaddy  # GoDaddy source zip from HEAD, validated (no node_modules/.next/.env) (docs/DEPLOY.md)
npm run build        # must pass before every commit
npm run test:e2e     # Playwright journeys in e2e/ (E2E_BASE_URL to reuse a server, PW_CHROMIUM_PATH for a local Chromium)
```

## Stack

Next.js 15 App Router · React 19 · TypeScript strict · Tailwind CSS 3 (tokens in `tailwind.config.ts`) ·
custom UI primitives (no shadcn dependency) · lucide-react · Supabase (`@supabase/ssr`) · zod · vitest · Playwright.
Charts are hand-written SVG behind `ChartShell`. No other runtime dependencies; ask before adding one.

## Access and providers (do not change without the owner)

- **Public:** `/` and the compliance pages (`/terms-and-conditions`, `/privacy-policy`, `/about`, `/support`, `/account-closure`,
  `/grievance-redressal`, `/legal/*`; URLs fixed by the NSEIXGA document) plus auth infrastructure. Every other page and `/api`
  route requires a fully verified session; the default-deny classifier is `src/lib/route-registry.ts`, enforced in
  `src/middleware.ts`. New routes are protected automatically. Return paths go through `safeReturnPath` only.
- **Accounts:** email + phone + password. Sign-in = email + password or Google (Supabase OAuth; a first Google sign-in completes
  phone, password, country, terms), then an SMS code when switched on. Never passwordless, other social login, or skip.
  The SMS step sits behind `NEXT_PUBLIC_SMS_SECOND_FACTOR` (off until 2Factor.in DLT approval; switch on together with
  migration 0007, `docs/AUTH-SECURITY.md`).
- **Providers:** Supabase Auth (identity/sessions/password), Resend (email, via the Send Email Hook), 2Factor.in (SMS),
  NewsData.io (news, the owner's "News IO" key). Never substitute (no NewsAPI.org, Twilio, Vonage, MessageBird, SNS).
- Provider secrets are server-only (`src/lib/server-env.ts`), never `NEXT_PUBLIC_`, never committed, never in the zip.

## Architecture rules (do not break)

1. **Data flow:** UI → `src/services/market-data.ts` → `getProvider()` → `DemoProvider` now, `RealProvider` later.
   Server components call services directly. Client components call `/api/v1/*` through `useApi`.
   Nothing outside `src/providers` and `src/services` may import seed data or call a vendor.
2. **Provider selection** happens only in `src/lib/config.ts` + `src/providers/index.ts`. No `if (demo)` in components.
3. **Identity:** instruments are addressed by immutable `ins_######` ids internally and by slug in URLs. Never key on ticker.
4. **Missing data:** `undefined` in `Asset.m` = not applicable, `null` = unavailable. Render `n/a` / `—`. Never a fake zero.
5. **Every data module shows `DataStatus`** (badge + exact timestamp). Never an open-ended "Updating…".
6. **Private data** goes through `WorkspaceRepo` (`src/features/workspace/repo.ts`). Never send `user_id` from the client;
   the column defaults to `auth.uid()` and RLS enforces it. Never import the service-role key in client code.
7. **Metrics** are declared once in `src/lib/metrics.ts`; tables, screener and compare read that registry.
8. **Routes/nav** are declared in `src/lib/routes.ts`.
9. **Design tokens** only. No raw hex in components except inside SVG chart renderers.
10. Route groups: `(site)` public shell, `(workspace)` authenticated shell with sidebar, `(auth)` two-column auth layout.
11. **Metadata** through `pageMetadata()` / `privateMetadata()` in `src/lib/seo.ts`; structured data through `src/lib/structured-data.tsx`.
12. **Content** (learn, glossary, FAQ, legal, videos) only through the async getters in `src/services/content.ts` (the CMS seam).

## Conventions

- Files: kebab-case. Server components by default; add `'use client'` only for interaction.
- Next 15: `params` and `searchParams` are Promises; `await` them.
- Copy: sentence case, plain verbs, no hype, no advice. See `docs/CONTENT.md`.
- Colour is never the only cue: changes carry ▲/▼ and a sign; statuses carry distinct glyphs.
- Accessibility floor: keyboard reachable, visible focus, labelled icon buttons, `prefers-reduced-motion` respected.
- Before finishing any task: `npm run typecheck && npm test && npm run build`, then update `docs/ROADMAP.md`.

## Current state in one paragraph

The documented product scope is built and runs with no configuration (demo data, demo auth): public routes, auth,
account, the full workspace, research (stocks, ETFs, markets, themes, sectors, countries) with a structured article
format, heatmap, screener, compare, identity model, SEO, a route registry, CSP, consent-gated analytics, a CMS-shaped
content library (44 guides, 36 terms), eight recorded tutorials, 2Factor.in SMS second factor, Resend email,
NewsData.io news, Google sign-in, public compliance pages with support/grievance/closure forms, and authenticated product access. It is not production-ready: see
`docs/CURRENT_STATE.md` and `docs/RELEASE_READINESS.md`. Official brand files are
integrated (`docs/BRAND_ASSET_INVENTORY.md`). A Supabase project is live (migrations 0001–0006 applied; 0007 in the repo, applied only with the SMS switch; `.env.local`); production domain https://inrgift.com; GoDaddy
deployment is a validated source zip that GoDaddy installs and builds (`docs/DEPLOY.md`). Market data stays on DemoProvider until NSE access exists. Test builds use
`NEXT_PUBLIC_AUTH_MODE=demo`. Start with `docs/ROADMAP.md`.
