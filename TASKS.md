# Iconify — Implementation Tasks

Sole implementation checklist for Iconify (referenced from [`SPEC.md`](./SPEC.md) §6). Check items as they complete. Do not mark done unless acceptance criteria in SPEC §7 for that slice are met **and** Vitest is green (`npm run test:unit` exit 0) for the covered slice (SPEC §6 / §8).

## M0 — Foundation

- [x] `SPEC.md` authored
- [x] `AGENTS.md` authored
- [x] Cursor SDD rules under `.cursor/rules/`
- [x] Enable Astro server mode / Node adapter as required for API routes
- [x] Add dependencies: `sharp`, `archiver`, ICO helper (`to-ico` or approved equivalent)
- [x] Create `src/lib/icons/matrix.ts` mirroring SPEC §2

## M1 — Processing Core

- [x] `renderIcon` — resize, padding, background/transparency
- [x] `renderOgImage` — 1200×630
- [x] `buildFaviconIco` — 16 / 32 / 48 layers
- [x] SVG passthrough for `favicon.svg` when source is SVG
- [x] ZIP stream packager (`createZipStream` / `zipToWebResponse`)
- [x] Vitest setup: `"test:unit": "vitest"` in `package.json` scripts
- [x] Vitest config (`vitest.config.ts`) targeting `src/**/*.{test,spec}.{ts,tsx}`
- [x] Unit tests for processing core: one assertion per SPEC §2 matrix filename/size (`renderIcon`, `renderOgImage`, `buildFaviconIco`, SVG passthrough)
- [x] Unit tests for UI `head` snippet generator (content matches SPEC §5.3)
- [x] Unit test that ZIP membership matches the generated asset set (no partial/empty archive)

## M2 — REST API

- [x] `src/pages/api/v1/generate.ts` — `POST` handler
- [x] Multipart parse + option defaults (SPEC §3)
- [x] Validation: MIME, extension, ≤ 10 MB, padding 0–50, hex colors
- [x] `200` streamed ZIP with `Content-Disposition`
- [x] `400` / `415` / `500` JSON error contract
- [x] Curl (or equivalent) verification of ZIP membership

## M3 — Astro UI

- [x] Dropzone island (drag/drop, browse, type/size validation)
- [x] Settings: padding, background, presets
- [x] Generate button → `FormData` POST → blob download
- [x] HTML snippet panel + copy to clipboard
- [x] Loading / disabled / error states (`aria-live`)
- [x] Mobile support styles

## M3b — Corner radius

SPEC §3 `cornerRadius` / §4 `applyCornerRadius` / §5 settings / AC8.

- [ ] Processing: `applyCornerRadius` SVG mask (`dest-in`) after pad/background in `renderIcon` + `renderOgImage` (ICO inherits via `renderIcon`); no-op at `0`; skip SVG passthrough
- [ ] Types + defaults: `GenerateOptions.cornerRadius` (0–50, default `0`) in `types` / `generate-defaults`
- [ ] API: accept multipart `cornerRadius`; validate 0–50 like padding; reject with `400 VALIDATION_ERROR` + `details.field: cornerRadius`
- [ ] UI: settings control (range/number 0–50, `%`); wire into settings state + `FormData` (`cornerRadius`)
- [ ] Unit tests: process mask math / no-op at 0; validate boundaries; API happy-path + invalid; settings → FormData mapping
- [ ] Verify AC8

## M3c — Site SEO & social meta

SPEC §5.6 / AC9. Layout: `src/layouts/app.astro`; assets: `public/` only.

- [x] Configure Astro `site` (canonical public origin) so social URLs can be absolute
- [x] Wire all §5.6 favicon / Apple Touch / Android Chrome links from `public/`
- [x] Core SEO: `<title>`, meta description, `link[rel=canonical]` for `/`
- [x] Open Graph: full §5.6 tag set with absolute `og:url` + `og:image` (`/og-image.png`, 1200×630)
- [x] Twitter Card: `summary_large_image` + title / description / absolute image + alt
- [x] Verify AC9 (view-source; optional Twitter/Facebook sharing debugger)

## M4 — Hardening

- [ ] Transparent PNG + opaque background edge cases
- [ ] Large SVG performance sanity check
- [ ] Omit SVG links/files when source is raster
- [ ] README aligned with SPEC usage

## M5 — Release

- [ ] SPEC status → Accepted
- [ ] Version bump + changelog
- [ ] Deploy config verified (SSR adapter if needed)

## Verification Shortcuts

| AC  | How to verify                                                               |
| --- | --------------------------------------------------------------------------- |
| AC1 | PNG + `presets=all` → unzip; list matches §2 minus SVG                      |
| AC2 | SVG upload → ZIP includes `favicon.svg`                                     |
| AC3 | `.gif` or 11 MB file → `400 VALIDATION_ERROR`                               |
| AC4 | `padding=20` → visual inset on PNGs                                         |
| AC5 | Inspect `favicon.ico` layers 16/32/48                                       |
| AC6 | UI download + copy snippet without reload                                   |
| AC7 | No leftover files under OS temp after request                               |
| AC8 | `cornerRadius=50` → circular square PNGs; `0` → square; bad value → `400`   |
| AC9 | View-source `/`: all §5.6 `public/` icons + absolute OG/Twitter + canonical |
