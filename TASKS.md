# Iconify — Implementation Tasks

Sole implementation checklist for Iconify (referenced from [`SPEC.md`](./SPEC.md) §6). Check items as they complete. Do not mark done unless acceptance criteria in SPEC §7 for that slice are met.

## M0 — Foundation

- [x] `SPEC.md` authored
- [x] `AGENTS.md` authored
- [x] Cursor SDD rules under `.cursor/rules/`
- [x] Enable Astro server mode / Node adapter as required for API routes
- [x] Add dependencies: `sharp`, `archiver`, ICO helper (`to-ico` or approved equivalent)
- [ ] Create `src/lib/icons/matrix.ts` mirroring SPEC §2

## M1 — Processing Core

- [ ] `renderIcon` — resize, padding, background/transparency
- [ ] `renderOgImage` — 1200×630
- [ ] `buildFaviconIco` — 16 / 32 / 48 layers
- [ ] SVG passthrough for `favicon.svg` when source is SVG
- [ ] `site.webmanifest` generator
- [ ] `head.html` / snippet generator
- [ ] ZIP stream packager (`createZipStream` / `zipToWebResponse`)
- [ ] Unit tests: one assertion per matrix filename/size

## M2 — REST API

- [ ] `src/pages/api/v1/generate.ts` — `POST` handler
- [ ] Multipart parse + option defaults (SPEC §3)
- [ ] Validation: MIME, extension, ≤ 10 MB, padding 0–50, hex colors
- [ ] `200` streamed ZIP with `Content-Disposition`
- [ ] `400` / `415` / `500` JSON error contract
- [ ] Curl (or equivalent) verification of ZIP membership

## M3 — Astro UI

- [ ] Dropzone island (drag/drop, browse, type/size validation)
- [ ] Settings: padding, background, presets, app name, theme/background colors
- [ ] Live preview grid (client approximation)
- [ ] Generate button → `FormData` POST → blob download
- [ ] HTML snippet panel + copy to clipboard
- [ ] Loading / disabled / error states (`aria-live`)

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

| AC  | How to verify                                          |
| --- | ------------------------------------------------------ |
| AC1 | PNG + `presets=all` → unzip; list matches §2 minus SVG |
| AC2 | SVG upload → ZIP includes `favicon.svg`                |
| AC3 | `.gif` or 11 MB file → `400 VALIDATION_ERROR`          |
| AC4 | `padding=20` → visual inset on PNGs                    |
| AC5 | Inspect `favicon.ico` layers 16/32/48                  |
| AC6 | UI download + copy snippet without reload              |
| AC7 | No leftover files under OS temp after request          |
