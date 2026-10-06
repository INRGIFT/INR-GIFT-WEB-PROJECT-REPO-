# Media and assets

The visual language is image-free by decision: no stock photos, no finance illustrations, no 3D, no decorative
gradients. Charts, heatmaps and data are the imagery.

What exists
- Logo: CSS-drawn mark + wordmark in `src/components/layout/site-header.tsx` (`Logo`). No logo file from the client yet.
- Icons: `lucide-react` only, stroke 1.75–2.
- Fonts: Inter and Manrope variable fonts self-hosted in `public/fonts` (latin and latin-ext, OFL licences alongside).
- Asset "avatars": ticker text on a neutral tile. No company logos (licensing).
- Tutorials in `public/media`: three screen recordings of the real product (WebM), each with a WebVTT caption file,
  a JPEG poster, chapters and a transcript in `VIDEOS` (`src/services/content.ts`). `VideoModule`
  (`src/features/media/video-module.tsx`) loads nothing until play, shows captions by default and falls back to the
  transcript. Placements: learn articles, support, resources, heatmap and screener.
- App icon `src/app/icon.svg` and a generated social card `src/app/opengraph-image.tsx`.

Needed
- Official INRGIFT logo (SVG), favicon, app icons, Open Graph image (or an OG image route).
- Decision on company/fund logos: licensed source or keep ticker tiles.
- Social profile links for the footer.

Reference material in `docs/reference/`: the two original briefs and `prototype-v1.html`, the single-file clickable
prototype of the first eleven screens. The prototype is visual reference for the auth, onboarding, workspace and ETF
review screens that are not yet rebuilt in Next.js. Do not import code from it.
