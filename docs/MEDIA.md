# Media and assets

The visual language is image-free by decision: no stock photos, no finance illustrations, no 3D, no decorative
gradients. Charts, heatmaps and data are the imagery.

What exists
- Logo: CSS-drawn mark + wordmark in `src/components/layout/site-header.tsx` (`Logo`). No logo file from the client yet.
- Icons: `lucide-react` only, stroke 1.75–2.
- Fonts: Manrope and Inter from Google Fonts via `<link>`.
- Asset "avatars": ticker text on a neutral tile. No company logos (licensing).
- `public/` is empty.

Needed
- Official INRGIFT logo (SVG), favicon, app icons, Open Graph image (or an OG image route).
- Self-hosted fonts through `next/font` (the build sandbox blocked Google Fonts, so `<link>` was used).
- Decision on company/fund logos: licensed source or keep ticker tiles.
- Social profile links for the footer.

Reference material in `docs/reference/`: the two original briefs and `prototype-v1.html`, the single-file clickable
prototype of the first eleven screens. The prototype is visual reference for the auth, onboarding, workspace and ETF
review screens that are not yet rebuilt in Next.js. Do not import code from it.
