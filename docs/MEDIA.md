# Media and assets

The visual language is mostly image-free: no stock photos, no finance illustrations, no decorative gradients.
Charts, heatmaps, data and product footage carry the visuals.

## What exists

**Logo:** the official INRGIFT brand library v1.0, used unmodified. Files are in `public/brand`, plus the favicon,
apple icon, PWA manifest and share images in `src/app`. They render through `src/components/brand/brand-logo.tsx`.
Inventory and usage rules: `docs/BRAND_ASSET_INVENTORY.md`.

**Icons:** `lucide-react` only, stroke 1.75–2.

**Fonts:** Inter and Manrope variable fonts, self-hosted in `public/fonts` with their OFL licences. The brand
guidelines' Montserrat is used only inside the supplied logo artwork, as outlines.

**Company and fund logos:** Logo.dev, behind `src/lib/logos`, with a ticker tile fallback. Tiles show whenever no key
is configured or a logo fails to load.

**Tutorials in `public/media`:** eight screen recordings of the real product on demo data. They are recorded by
`scripts/record-tutorials.mjs`.
- Videos: "INRGIFT in 60 seconds" (product walkthrough), "Universal search", research an asset, heatmap, screener, ETF eight-step review, market hours on India
  time, and data status and methodology.
- Each video has VP9 WebM, a WebVTT caption file, a JPEG poster, chapters and a transcript (`VIDEOS` in
  `src/services/content.ts`).
- `VideoModule` loads nothing until play, shows captions by default and falls back to the transcript.
  `TutorialDisclosure` places a video collapsed under a page's main tool.
- Placements:
  - learn articles
  - support
  - resources
  - heatmap, screener and ETF review pages
  - markets
  - data and methodology

**Homepage tours ("See how INRGIFT works."):** the three recordings the homepage already used — "INRGIFT in 60
seconds" (`product-walkthrough`, 0:42, 1.0 MB), "Universal search" (0:27, 0.6 MB) and "Read the global heatmap"
(`heatmap-drill-down`, 0:28, 0.4 MB) — in a player with a playlist (`src/features/home/video-showcase.tsx`). No new
video files. Before play there is no `<video>` element at all, only a lazy WebP poster, so no video byte is requested;
play mounts the player with captions on and native controls and plays with sound because the visitor asked; it pauses
when scrolled out of view; choosing another tour swaps it in (one video at a time). Browsers that cannot play WebM, or
a failed file, get a message and the transcript. Each tour shows its poster, title, summary, duration, size
(`bytes` in `VIDEOS`, checked against the file by `tests/home.test.ts`), captions and transcript.
Posters: `public/media/posters/<id>-640.webp` and `-1280.webp`, made from the JPEG posters:
`ffmpeg -i public/media/<id>.jpg -vf scale=640:-2 -c:v libwebp -quality 80 public/media/posters/<id>-640.webp`
(and 1280). The JPEG stays as the fallback.

## Re-recording

After a UI change, start a demo-mode production build (`NEXT_PUBLIC_AUTH_MODE=demo npm run build && npx next start`)
and run:

```bash
PW_CHROMIUM_PATH=/path/to/chromium node scripts/record-tutorials.mjs http://localhost:3000 [id …]
```

Captions only describe what is on screen, and each caption is held long enough to read. Check one frame per caption
before committing, and update `VIDEOS` from the generated `<id>.json` (then delete the JSON files).

## Still to do

- MP4 copies for older Safari.
- Social profile links for the footer.
