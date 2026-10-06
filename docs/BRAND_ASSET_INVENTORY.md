# Brand asset inventory

Source: `INRGIFT_COMPLETE_LOGO_ASSET_LIBRARY.zip` (supplied by the owner, 2026-10-06). The library is version 1.0,
generated 30 September 2026, with 692 files (31.1 MB).

- **Master:** `01_VECTOR_MASTER/SVG/INRGIFT_Horizontal_NavyCobalt.svg`. Every other file in the library was
  generated from this one vector.
- **QC report:** 17 checks passed, 0 failed (`13_README/QC_REPORT.md`).
- **Rule:** INRGIFT uses these files as supplied. The emblem is never redrawn, the wordmark never retyped and the
  artwork never recoloured, distorted or rearranged, and no variants are invented.

## Identity

| Element | What it is |
| --- | --- |
| Emblem | A ₹ made of two slanted bars and a curved leg. A cobalt arrow continues the top bar upward. Slant angles are fixed at 49.34° (bars) and 45.92° (leg). There is no approved micro emblem; the same geometry is used down to 16 px. |
| Wordmark | "INRGIFT" in custom lettering, supplied as outlines. It is not a font. |
| Tagline | **INVEST BEYOND BORDERS**, in Montserrat Medium, supplied as outlines inside the tagline lockups. |
| Lockups | Horizontal (primary, includes the tagline) · Stacked · Emblem · Wordmark · Wordmark + tagline |
| Colourways | NavyCobalt (primary) · Black · White · Navy (mono) · ReverseWhiteCobalt (for dark backgrounds) |

Brand colours, from the guidelines:

| Name | Hex |
| --- | --- |
| Primary Navy | #071A33 |
| Accent Cobalt | #245BFF |
| Ice Blue | #DCE8FF |
| Near Black (wordmark) | #0B0E14 |
| White | #FFFFFF |

The product UI uses the owner-specified #245BFE as `brand`. That is one unit off the logo's #245BFF, which is
invisible on screen. The logo files keep #245BFF; they are never recoloured.

The guidelines name Montserrat as the brand typeface for documents. The product UI uses Manrope for display text and
Inter for UI text, as the owner specified. Neither font is used to recreate any logo element.

## Library contents

| Folder | Files | Formats | Notes |
| --- | --- | --- | --- |
| `01_VECTOR_MASTER/SVG` | 25 + 25 | SVG, SVGZ | 5 lockups × 5 colourways. One path per colour; no raster images, masks or live text. Horizontal viewBox is 7868.22 × 2012.41. |
| `01_VECTOR_MASTER/PDF` | 50 | PDF | RGB and CMYK (FOGRA39) for every lockup and colourway |
| `01_VECTOR_MASTER/EPS` | 50 | EPS | RGB and CMYK |
| `01_VECTOR_MASTER/AI` | 25 | AI | PDF-compatible, RGB |
| `02_PRIMARY_LOGO/*` | 20 | SVG, PNG 4096, WebP 4096, PDF | NavyCobalt: Emblem, Horizontal, Stacked, Wordmark, WordmarkTagline |
| `03_COLOR_VARIANTS/*` | 62 | SVG, PNG 4096 | One folder per colourway. `Backgrounds/` holds opaque versions on White, Ice Blue, Navy and Near Black (Horizontal 4096 × 1152; Emblem and Stacked 4096 × 4096). |
| `04_PNG_4K/<size>` | 165 | PNG (transparent) | Sizes 4096, 2048, 1024, 512, 256 and 128 for all 25 combinations. Emblem only at 64, 32 and 16. Horizontal/Wordmark files are sized by width (`…w.png`). |
| `05_WEB/SVG` | 14 | SVG | See [Web files](#web-files) below |
| `05_WEB/PNG`, `05_WEB/WebP` | 45 + 45 | PNG, lossless WebP | @1x/@2x/@3x versions of the web files, plus 4096 px transparent, light-background and dark-background masters |
| `05_WEB/PWA` | 5 | PNG, webmanifest | 192 and 512 icons, regular and maskable (navy background) |
| `05_WEB/OG` | 4 | PNG | Social share images: 1200 × 630 and 4096 × 2150, in dark (navy) and light |
| `06_FAVICON` | 12 | ICO (16/32/48), PNG 16/32/48, SVG, apple-touch 180 | The SVG switches the ₹ to white in browser dark mode. Includes an HTML snippet. |
| `07_APP` | 64 | PNG, SVG, XML, JSON | App icon master (white ₹ and cobalt arrow on navy, 4096 → 72 px), a drop-in iOS `AppIcon.appiconset` (no alpha channel), Android adaptive and legacy icons, and a Play Store 512 icon |
| `08_SOCIAL` | 24 | PNG, SVG | Profile images and covers for Instagram, LinkedIn, X, YouTube, WhatsApp and Telegram, each as a 4096 master plus native sizes |
| `09_PRINT` | 28 | PDF, SVG | Business card, letterhead, invoice, legal document, presentation, signage and packaging (CMYK with 3 mm bleed, and RGB), plus emboss/deboss and engraving plates |
| `10_3D` | 12 | GLB, glTF, FBX, OBJ, PNG | Extruded emblem. For signage and hero renders only, never in UI. |
| `11_MOTION` | 10 | MP4 (1920 × 1080, 4096 × 2304), MOV and WebM with alpha, Lottie | 4-second logo reveal in light and dark |
| `12_BRAND_GUIDELINES` | 1 | PDF | 20 pages: usage, clear space, minimum sizes, backgrounds, don'ts |
| `13_README` | 5 | MD, TXT, JPG, PNG | README, QC report, directory listing, approved reference board, overlay validation |

### Web files

| File | Size | Intended use |
| --- | --- | --- |
| `INRGIFT_Web_Header_Desktop_Light` / `_Dark` | 250 × 64 at 1x | Desktop header |
| `INRGIFT_Web_Header_Mobile_Light` / `_Dark` | 32 × 36 at 1x | Mobile header (emblem) |
| `INRGIFT_Web_Header_Mobile_Wordmark_Light` | 127 × 22 at 1x | Optional mobile wordmark |
| `INRGIFT_Web_Footer_Light` / `_Dark` | 280 × 72 at 1x | Footer |
| `INRGIFT_Web_Login`, `_Login_Dark`, `_Signup` | 225 × 200 at 1x | Auth pages (stacked lockup) |
| `INRGIFT_Web_Loading_Emblem` (+ `_Dark`, `_Animated`) | 85 × 96 at 1x | Loader. The animated version honours `prefers-reduced-motion`. |

### Rules (from the guidelines)

- **Clear space:** 1X on every side, where X is the height of the emblem's top bar.
- **Minimum digital widths:**

  | Lockup | Minimum width |
  | --- | --- |
  | Horizontal | 220 px |
  | Stacked | 160 px |
  | Wordmark + tagline | 160 px |
  | Wordmark | 64 px |
  | Emblem | 16 px |

- **Web sizes:**

  | Placement | Size |
  | --- | --- |
  | Desktop header | Horizontal at 64 px tall |
  | Mobile header | Emblem at 36 px tall |
  | Footer | Horizontal at 280 px wide |
  | Login / signup | Stacked at 200 px tall |
  | Social share | 1200 × 630 |

- **Backgrounds:** use NavyCobalt on light backgrounds and Reverse on dark ones.
- **Never:** stretch, rotate, recolour, outline, add effects or rearrange the logo, retype the wordmark, or re-set
  the tagline.

### Decisions the library flags for the owner (README §1)

1. The ₹ top bar on the reference board is a lighter navy, about #001F4C. The master uses #071A33.
2. The wordmark uses Near Black, #0B0E14.
3. The stacked lockup was rebuilt from the master, because the board's stacked tile is inconsistent.
4. Stray characters on the board's White Reverse tile were ignored.
5. There is no micro emblem.

These are recorded here and not changed in code.

## What the product uses

Files are copied unmodified into the repository.

| Use | Repository file | Library source |
| --- | --- | --- |
| Desktop header (≥1024 px) | `public/brand/web/INRGIFT_Web_Header_Desktop_Light.svg`, rendered 219 × 56 | `05_WEB/SVG` |
| Mobile header (<1024 px) | `public/brand/web/INRGIFT_Web_Header_Mobile_Light.svg`, 32 × 36 | `05_WEB/SVG` |
| Footer | `public/brand/web/INRGIFT_Web_Header_Desktop_Light.svg`, 282 × 72 | `05_WEB/SVG` |
| Auth panel (navy) | `public/brand/web/INRGIFT_Web_Login_Dark.svg`, 162 × 144 | `05_WEB/SVG` |
| Dark-background variants | `…_Dark.svg` files in `public/brand/web` | `05_WEB/SVG` |
| Loader (copied, not used) | `public/brand/web/INRGIFT_Web_Loading_Emblem_Animated.svg`. Data modules use skeletons sized to their content instead. | `05_WEB/SVG` |
| Vector lockups | `public/brand/logo/INRGIFT_{Emblem,Horizontal,Stacked,Wordmark,WordmarkTagline}_*.svg` | `01_VECTOR_MASTER/SVG` |
| Organisation logo (JSON-LD) | `public/brand/logo/INRGIFT_Emblem_NavyCobalt_512.png` | `04_PNG_4K/512` |
| Favicon | `src/app/icon.svg`, `src/app/favicon.ico`, `public/icon.svg` | `06_FAVICON` |
| Apple touch icon | `src/app/apple-icon.png` (180 × 180) | `06_FAVICON/apple-touch-icon.png` |
| PWA icons | `public/brand/pwa/*.png`, referenced by `src/app/manifest.ts` | `05_WEB/PWA` |
| Open Graph / Twitter card | `src/app/opengraph-image.png`, `src/app/twitter-image.png` (1200 × 630, dark) | `05_WEB/OG` |
| Light share image (spare) | `public/brand/INRGIFT_OG_Share_Light_1200x630.png` | `05_WEB/OG` |
| Auth emails | `public/brand/email/INRGIFT_Web_Header_Desktop_Light@2x.png`, shown at 220 × 56 | `05_WEB/PNG` |

The rendered header logo is 219 × 56 rather than the guideline's 250 × 64. That keeps the header at 72 px on desktop
while staying at the horizontal lockup's 220 px minimum. All logo rendering goes through
`src/components/brand/brand-logo.tsx`, so changing the size is a one-line edit.

Not used in the web product: print, 3D, app-store, social-platform and motion files. They stay in the library for
their own channels.
