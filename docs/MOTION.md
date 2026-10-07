# Motion

Premium, restrained, purposeful. Data pages prioritise speed.

Durations: 120–180 ms micro interactions · 180–280 ms panels, dialogs, popovers · 250–400 ms layout transitions.
Easing: `ease-out` / `cubic-bezier(0.22, 1, 0.36, 1)` (Tailwind `ease-out`, token `ease-out` alias `out`).

Implemented (Tailwind keyframes in `tailwind.config.ts`, base rules in `globals.css`)
- `animate-pop-in` — dropdowns, search palette, column picker, native `<dialog>` entry.
- `animate-fade-up` — toast, heatmap quick view, new filter rows, compare chips.
- `animate-confirm` — star scale on watch toggle.
- `animate-shimmer` — low-contrast skeletons.
- Buttons compress to .98 on press; hover surfaces lighten; header active-nav underline fades.
- Sidebar width transition 200 ms.
- Heatmap tiles transition position/size/colour over 300 ms on drill-down and control changes.
- Chart dims to 50% opacity while a new range loads; bars animate width.
- `prefers-reduced-motion: reduce` collapses all animation and transition durations.

Rules: no parallax, no bouncing, no animated number tickers, no per-card entrance animations on dashboards, nothing
essential conveyed only by motion.

Also implemented: duration tokens (`duration-micro` 150 ms, `duration-panel` 220 ms, `duration-layout` 320 ms);
`animate-fade-in` route transition via `(site)/template.tsx`; tab content fade and indicator; drawer slide-in;
chart crosshair tooltip fade; video play-button press; onboarding step fade-up.

Homepage (7 Oct 2026): blocks marked `data-reveal` fade up 12 px over 600 ms the first time they scroll into view
(`src/features/home/reveal.tsx`, one IntersectionObserver). Only blocks that start below the fold are ever hidden, and
only after the script runs, so there is no flash, nothing is hidden without JavaScript, and with reduced motion
nothing is hidden at all. Rows tint and show an accent line on hover, posters scale by 1 %, CTA arrows nudge 2 px. The hero chart
switches period without animation. Nothing moves on its own: no ticker marquee, no autoplay, no parallax.
