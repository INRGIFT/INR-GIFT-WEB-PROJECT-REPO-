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
npm run build        # must pass before every commit
npm run test:e2e     # Playwright; no specs exist yet
```

## Stack

Next.js 15 App Router · React 19 · TypeScript strict · Tailwind CSS 3 (tokens in `tailwind.config.ts`) ·
custom UI primitives (no shadcn dependency) · lucide-react · Supabase (`@supabase/ssr`) · zod · vitest · Playwright.
Charts are hand-written SVG behind `ChartShell`. No other runtime dependencies; ask before adding one.

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
10. Route groups: `(site)` public shell, `(workspace)` authenticated shell with sidebar, `(auth)` auth layout (to be created).

## Conventions

- Files: kebab-case. Server components by default; add `'use client'` only for interaction.
- Next 15: `params` and `searchParams` are Promises; `await` them.
- Copy: sentence case, plain verbs, no hype, no advice. See `docs/CONTENT.md`.
- Colour is never the only cue: changes carry ▲/▼ and a sign; statuses carry distinct glyphs.
- Accessibility floor: keyboard reachable, visible focus, labelled icon buttons, `prefers-reduced-motion` respected.
- Before finishing any task: `npm run typecheck && npm test && npm run build`, then update `docs/ROADMAP.md`.

## Current state in one paragraph

Public product is built and compiles: home, markets, assets, all seven asset detail types, discover (heatmap,
screener, compare, collections, trending), research, resources, the `/api/v1` router, DemoProvider and both SQL
migrations. Auth and workspace **logic** exists (adapters, session, repo, context, middleware) but their **pages do
not**: `/login`, `/signup` and everything under `/app`, `/account`, `/notifications` are the next thing to build.
Static pages (`/about`, `/pricing`, `/faq`, `/support`, `/contact`, `/legal/*`) are also missing; their content is
already in `src/services/content.ts`. Nothing has been reviewed visually in a browser. Details: `docs/ROADMAP.md`.
