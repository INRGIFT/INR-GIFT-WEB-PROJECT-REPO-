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

Rules: brand stays blue/navy/white. Green and red are for market movement and status only. Colour is never the sole
cue (▲/▼ + sign; status glyphs ● ▲ ■ ○ ◌ ◐ ◆).

## Typography
Manrope (`font-display`, 600–800) for headings and large metrics; Inter (`font-sans`, 400–700) for UI, body, data.
Loaded via `<link>` in `src/app/layout.tsx` (move to `next/font` — see ROADMAP).
Scale: hero 34→46px · page H1 28→34px · section H2 18px · panel title 15px · body 14–15px · small 12–13px · micro 11px.
Line-height: display 1.08–1.15, headings 1.2, body 1.55. Numbers use `.num` (tabular, no wrap). Sentence case; no
all-caps eyebrows.

## Spacing, shape, elevation
4px base. Page gutters 16 / 24 / 32px. Max width `max-w-page` 1360px, `max-w-wide` 1560px for data pages.
Radius: `rounded-card` 13px, `rounded-ctl` 10px, `rounded-lg` 8px for small controls. Borders carry hierarchy;
`shadow-card` is nearly flat, `shadow-pop` only for popovers/dialogs. No gradients, glass, blur, stock photos or
illustrations.

## Controls
Buttons (`components/ui/button.tsx`): heights 32 / 40 / 44; variants primary, secondary, ghost, danger; press scales
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

## Named in the brief but not built yet
Tabs, Tooltip (native `title` is used), Popover/Dropdown (header has ad-hoc menus), Combobox, Drawer, DateRange,
standalone Pagination, ChartToolbar (inline in ChartShell), CalendarList/NewsList (inline). Extract when a second
consumer appears; do not duplicate.

## Charts
Thin gridlines (#E5EAF1), 11px axis labels, right-hand price axis, compact tooltip, shared range control. Line/area
colour follows period direction; overlays: SMA 20 solid brand, EMA 50 dashed saffron, benchmark dashed slate.
Compare lines are distinguished by colour **and** dash pattern.
