# Design system

Source of truth: `tailwind.config.ts` (tokens) and `src/app/globals.css` (base + a few component classes).
Default theme is light. A dark theme is not built.

## Colour
| Token | Hex | Use |
| --- | --- | --- |
| `brand` / `brand-ink` / `brand-soft` | #245BFE / #1B46C9 / #EAF0FF | Primary action, links, active states |
| `navy` | #071A33 | Text, dark surfaces |
| `slate2` / `faint` | #4A5770 / #6F7C93 | Secondary / tertiary text |
| `bg` / `soft` / `hover` | #F7F9FC / #F2F5F9 / #EEF2F7 | App background / soft surface / hover |
| `line` / `line2` | #E5EAF1 / #D7DEE8 | Border / strong border |
| `up` / `down` / `warn` | #0B7F56 / #C2352B / #9A6408 | Semantic only: movement and state |
| `saffron` | #E8862A | India-context accent line and the "now" marker only |
| `ice` / `ink` | #DCE8FF / #0B0E14 | Brand library colours (light brand surfaces / near-black). The logo files themselves are never recoloured. |
| `focus` | #245BFE | Focus outline and `ring-focus` |
| `status-*` | live #0B7F56 · delayed #9A6408 · eod #1B46C9 · closed #4A5770 · unavailable #6F7C93 · stale #9A6408 · error #C2352B | Data-status badges only, always with the status glyph |

Rules: brand stays blue/navy/white. Green and red are for market movement and status only. Colour is never the sole
cue (▲/▼ + sign; status glyphs ● ▲ ■ ○ ◌ ◐ ◆).

## Typography
Manrope (`font-display`, 600–800) for headings and large metrics; Inter (`font-sans`, 400–700) for UI, body, data.
Self-hosted variable fonts declared in `globals.css` and preloaded in `src/app/layout.tsx`.
Scale tokens (`text-*`): micro 11 · caption 12 · ui 13 · body 14 · lead 15 · h4 17 · h3 20 · h2 24 · h1 34 · display 48 px. Older code still uses arbitrary sizes in the same steps; new code uses the tokens.
Line-height: display 1.08–1.15, headings 1.2, body 1.55. Numbers use `.num` (tabular, no wrap). Sentence case; no
all-caps eyebrows.

## Spacing, shape, elevation
Breakpoints (`screens`): sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536. Header height `--header-h`: 64px, 72px from `lg` (room for the official horizontal logo at its 220px minimum).
4px base. Page gutters 16 / 24 / 32px. Max width `max-w-page` 1360px, `max-w-wide` 1560px for data pages.
Radius: `rounded-card` 13px, `rounded-ctl` 10px, `rounded-lg` 8px for small controls. Borders carry hierarchy;
`shadow-card` is nearly flat, `shadow-pop` only for popovers/dialogs. No gradients, glass, blur, stock photos or
illustrations.

## Controls
Height tokens: `h-ctl-sm` 32 · `h-ctl-cmp` 36 · `h-ctl` 40 · `h-ctl-lg` 44 · `h-search` 44 · `h-search-lg` 48.
Buttons (`components/ui/button.tsx`): compact 32, standard 40, primary/action 44 (primary defaults to 44); variants primary, secondary, ghost, danger; press scales
to .98. Pills only for filter chips and statuses. Inputs use `.field` (40px, 44–48 for primary search), visible focus ring.
Icons: lucide only, stroke 1.75–2.

## Components that exist
`ui/button` Button, ButtonLink, IconButton · `ui/primitives` Card, Panel, Badge, Change, Metric, MetricGrid, Skeleton,
SkeletonRows, EmptyState, ErrorState, InlineError, Breadcrumbs, PageContainer, PageHeader, Section, Segmented, Bar,
DivergingBar · `ui/data-status` StatusBadge, DataStatus · `ui/dialog` Dialog · `ui/toast` ToastProvider/useToast ·
`ui/sparkline` · `layout/*` SiteHeader, SiteFooter, WorkspaceSidebar, WorkspaceTabs, MobileBottomNav, Providers ·
feature components: AssetTable, AssetIdentity, MetricCell, MiniList, Price, AssetDirectory, AssetDetail, ChartShell,
SvgChart, Heatmap, Screener (FilterBuilder inside), Compare, SearchProvider, SessionRail, IndexStrip, Movers,
SectorPanel, WatchButton, AlertButton, CompareButton, SaveButton, RowActions, AssetNotes, NoteDialog.

## Added in October 2026
`ui/tabs` Tabs (WAI-ARIA, arrow keys) · `ui/menu` Menu (dropdown with keyboard navigation) · `ui/drawer` Drawer ·
`ui/field` TextField, PasswordField, SelectField, TextArea, CodeField, Switch, Checkbox, ChoiceChips ·
`ui/primitives` Callout, Pagination, Kbd · component classes `.card-link`, `.row-link`, `.chip`, `.hint` ·
`layout/route-states` PageSkeleton, RouteError · `charts/multi-line-chart` MultiLineChart, SeriesLegend ·
`media/video-module` VideoModule · `workspace/ws-ui` WsPage, AssetPicker (combobox), useAssets.
Rules: grids default to `minmax(0,1fr)` and scroll containers are positioned, so content never widens the page.

Still not built (extract when needed): Tooltip (native `title` is used), Combobox for non-asset values, DateRange.

## Charts
Drawn at real pixel width (labels stay 11px on phones). Thin gridlines (#E5EAF1), 11px axis labels, right-hand price axis, compact tooltip, shared range control. Line/area
colour follows period direction; overlays: SMA 20 solid brand, EMA 50 dashed saffron, benchmark dashed slate.
Compare lines are distinguished by colour **and** dash pattern.

## Brand
Official logo files only, via `BrandMark` / `Logo` in `src/components/brand/brand-logo.tsx` (inventory and rules:
`docs/BRAND_ASSET_INVENTORY.md`). Tagline **INVEST BEYOND BORDERS** lives inside the logo artwork; where it appears as
text it is `SITE.slogan` and is never reworded.

## State components
`Skeleton`/`SkeletonRows` (loading), `EmptyState` (nothing yet), `NoResults` (a search or filter matched nothing),
`UnavailableState` (the source has no data — pairs with UNAVAILABLE), `ErrorState` + `RetryButton` (request failed),
`Callout` (page notices, including STALE), `useToast` (confirmations), `DataStatus`/`StatusBadge` (every data module).
