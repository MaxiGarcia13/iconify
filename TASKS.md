# Iconify — Implementation Tasks

Sole implementation checklist for Iconify (referenced from [`SPEC.md`](./SPEC.md) §6). Check items as they complete. Do not mark done unless acceptance criteria in SPEC §7 for that slice are met **and** Vitest is green (`npm run test:unit` exit 0) for the covered slice.

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
- [x] Vitest config (`vitest.config.ts`) targeting `src/tests/**/*.{test,spec}.{ts,tsx}`
- [x] Unit tests for processing core: one assertion per SPEC §2 matrix filename/size (`renderIcon`, `renderOgImage`, `buildFaviconIco`, SVG passthrough)
- [x] Unit tests for UI `head` snippet generator (content matches SPEC §5.3)
- [x] Unit test that ZIP membership matches the generated asset set (no partial/empty archive)

## M2 — REST API

- [x] `src/pages/api/v1/generate.ts` — `POST` handler
- [x] Multipart parse + option defaults (SPEC §3)
- [x] Validation: MIME, extension, ≤ 10 MB, padding 0–50, hex colors
- [x] `200` streamed ZIP with `Content-Disposition`
- [x] `400` / `403` / `415` / `500` JSON error contract
- [x] Curl (or equivalent) verification of ZIP membership

## M3 — Astro UI

- [x] Dropzone island (drag/drop, browse, type/size validation)
- [x] Settings: padding, background, presets
- [x] Generate button → `FormData` POST → blob download
- [x] HTML snippet panel + copy to clipboard
- [x] Loading / disabled / error states (`aria-live`)
- [x] Mobile support styles

## M3b — Corner radius

SPEC §3 `cornerRadius` / §4 processing / §5 settings / AC8.

- [x] Processing: `applyCornerRadius` SVG mask (`dest-in`) after pad/background in `renderIcon` + `renderOgImage` (ICO inherits via `renderIcon`); no-op at `0`; skip SVG passthrough
- [x] Types + defaults: `GenerateOptions.cornerRadius` (0–100, default `0`) in `types` / `generate-defaults`
- [x] API: accept multipart `cornerRadius`; validate 0–100; reject with `400 VALIDATION_ERROR` + `details.field: cornerRadius`
- [x] UI: settings control (range/number 0–100, `%`); wire into settings state + `FormData` (`cornerRadius`)
- [x] Unit tests: process mask math / no-op at 0; validate boundaries; API happy-path + invalid; settings → FormData mapping
- [x] Verify AC8

## M3c — Site SEO & social meta

SPEC §5.5 / AC9. Layout: `src/layouts/app.astro`; assets: `public/` only.

- [x] Configure Astro `site` (canonical public origin) so social URLs can be absolute
- [x] Wire all §5.5 favicon / Apple Touch / Android Chrome links from `public/`
- [x] Core SEO: `<title>`, meta description, meta keywords (`package.json`), `link[rel=canonical]` for `/`
- [x] Open Graph: full §5.5 tag set with absolute `og:url` + `og:image` (`/og-image.png`, 1200×630)
- [x] Twitter Card: `summary_large_image` + title / description / absolute image + alt
- [x] Ship `public/site.webmanifest` (name / icons / colors / display per §5.5)
- [x] Document head: `link[rel=manifest]` + `meta[name=theme-color]`
- [x] Verify AC9 (view-source; optional Twitter/Facebook sharing debugger)

## M3d — Monochrome

SPEC §3 `monochrome` / §4 greyscale / §5 settings / AC10.

- [x] Processing: Sharp `.greyscale()` on upload content when `monochrome` is true (before background composite) in `renderIcon` + `renderOgImage` (ICO inherits); no-op when false; skip SVG passthrough
- [x] Types + defaults: `GenerateOptions.monochrome` (`boolean`, default `false`) in `types` / `generate-defaults`
- [x] API: accept multipart `monochrome` as literals `true` / `false` (omit → `false`); reject other values with `400 VALIDATION_ERROR` + `details.field: monochrome`
- [x] UI: settings checkbox/switch; wire into settings state + `FormData` (`monochrome=true|false`)
- [x] Unit tests: process greyscale on / off; validate accept/reject; API happy-path + invalid; settings → FormData mapping
- [x] Verify AC10

## M3e — Original size preset

SPEC §2.5 upload-basename / §2.6 preset `original` / §4 / §5 presets / AC11.

- [x] Matrix: `original` preset row → native size; `all` still expands to §2.1–§2.4 only
- [x] Processing: `renderOriginal` — canvas = source metadata W×H; pad / background / cornerRadius / monochrome; preserve aspect
- [x] Types: `PresetId` includes `'original'`; validate accepts `original`; reject unknown IDs
- [x] Package: include original-size file when preset selected (alone or combined); ZIP name = upload basename
- [x] UI: Presets checkbox **Original** selected by default with `all`; independent of `all`
- [x] Defaults: omit `presets` → `all,original`
- [x] Unit tests: dimensions match source; options applied; `all` ZIP omits original; `original` alone uses upload name; settings → FormData
- [x] Verify AC11

## M3f — Live dropzone preview (server)

SPEC §3.3 / §5.2–§5.3.1 / AC13. Preview via `POST /api/v1/preview` (same Sharp treatment as packaged rasters); UI debounces with `@maxigarcia/js-utils` `debounce` and aborts in-flight fetches on newer changes.

### API

- [x] `src/pages/api/v1/preview.ts` — `POST` handler; `prerender = false`
- [x] Same-origin guard + multipart-only (`403` / `415`) matching generate
- [x] Validate `file` + visual options only (`padding`, `cornerRadius`, `monochrome`, `background`); ignore / do not require `presets`
- [x] Process with shared icon pipeline → **256×256** PNG (`image/png`); no ZIP; no temp files
- [x] Error JSON contract aligned with generate (`VALIDATION_ERROR`, `PROCESSING_ERROR`, …)
- [x] Unit tests: happy-path 256×256 PNG; options applied; invalid file/options → `400`; missing/cross-origin → `403`; presets not required

### UI

- [x] On valid file select → request preview; show returned image in the dropzone
- [x] Debounce preview calls with `debounce` from `@maxigarcia/js-utils` when `padding` / `cornerRadius` / `monochrome` / `background` change
- [x] Abort in-flight preview (`AbortController`) when a newer settings change, file replace, or clear happens after the request was already sent
- [x] Presets do not trigger preview
- [x] Aborted / superseded responses must not update the UI
- [x] Click preview → file picker; drop another valid file → replace source; keep current settings; abort prior preview; re-preview
- [x] Clear → abort pending preview; empty dropzone prompt; preview hidden
- [x] Unit tests: debounce wiring; abort on newer change; presets ignored; aborted responses ignored; replace keeps settings; clear restores idle
- [x] Verify AC13

## M3g — Remove background (client)

SPEC §5.3.2 / AC14. Browser-only cutout via `@imgly/background-removal` (not the Node package). **Not** a settings control and **not** a generate/preview API field — mutates the source `File`, then existing preview/generate pipelines apply.

### Spec

- [x] SPEC: document dropzone **Remove background** action (outside Settings); client-only; raster PNG/JPG only; SVG disabled/hidden; output replaces source as PNG with alpha; settings unchanged; live preview re-runs on new file
- [x] SPEC: AC14 acceptance criterion + Document History bump
- [x] Non-goal / note: no `removeBackground` multipart field on generate or preview

### Deps & assets

- [x] Add `@imgly/background-removal` (browser). Do **not** add `@imgly/background-removal-node`. Add `onnxruntime-web` only if the package peer actually requires an explicit install
- [x] Lazy-load the library (dynamic `import`) on first use — do not inflate the initial island bundle
- [x] Model/WASM via library CDN default (no custom `publicPath` / no self-host sync)

### Client

- [x] Service helper: run removal on a `File`/`Blob` → PNG `Blob`/`File` with alpha; sensible basename (e.g. preserve stem + `.png`, or `-nobg.png`)
- [x] Progress callback wiring for model download + inference (surface to UI)
- [x] Error mapping: failure → inline / `aria-live` message; do not clear the current file
- [x] Optional **Undo**: keep pre-removal `File` in memory until clear / replace / another remove; restore on Undo

### UI

- [ ] Dropzone action bar (next to Clear): **Remove background** — not in Settings panel
- [ ] Enabled only when a valid raster source is selected; disabled for SVG, while removal/generate/preview pending, and when no file
- [ ] Pending state: disable control + announce progress; abort/supersede rules if user clears or replaces mid-run
- [ ] On success: replace `file` with cutout PNG; keep current settings; live preview re-fetches automatically
- [ ] Clear / replace source: discard undo buffer; abort in-flight removal

### Tests

- [ ] Unit tests: helper produces PNG File/Blob; SVG path not offered / rejected; basename rules; undo restores prior file; pending/clear does not apply stale result
- [ ] Verify AC14

## M4 — Hardening

- [x] Transparent PNG + opaque background edge cases
- [x] Large SVG performance sanity check
- [x] Omit SVG links/files when source is raster
- [x] README aligned with SPEC usage
- [x] Same-origin guard on `POST /api/v1/generate` (SPEC §3.5 / AC12)
- [x] Unit tests: matching `Origin` → proceeds; missing / cross-origin → `403 FORBIDDEN_ORIGIN`; no ACAO header
- [x] Verify AC12

## M5 — Release

- [x] SPEC status → Accepted
- [x] Version bump + changelog
- [x] Deploy config verified (SSR adapter if needed)

## Verification Shortcuts

| AC   | How to verify                                                                                                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1  | PNG + `presets=all` → unzip; list matches §2 minus SVG                                                                                                                                  |
| AC2  | SVG upload → ZIP includes `favicon.svg`                                                                                                                                                 |
| AC3  | `.gif` or 11 MB file → `400 VALIDATION_ERROR`                                                                                                                                           |
| AC4  | `padding=20` → visual inset on PNGs                                                                                                                                                     |
| AC5  | Inspect `favicon.ico` layers 16/32/48                                                                                                                                                   |
| AC6  | UI download + copy snippet without reload                                                                                                                                               |
| AC7  | No leftover files under OS temp after request                                                                                                                                           |
| AC8  | `cornerRadius=100` → circular square PNGs; `0` → square; bad value → `400`                                                                                                              |
| AC9  | View-source `/`: all §5.5 `public/` icons + `site.webmanifest` + theme-color + absolute OG/Twitter + canonical                                                                          |
| AC10 | `monochrome=true` → greyscale rasters; `false`/omit → color; bad → `400`                                                                                                                |
| AC11 | Default/`original` → upload basename at source size; explicit `all` omits it                                                                                                            |
| AC12 | Missing/cross-origin `Origin` → `403 FORBIDDEN_ORIGIN`; same-origin OK                                                                                                                  |
| AC13 | Upload → `POST /api/v1/preview` 256 PNG; debounced re-fetch; abort in-flight on newer change; presets ignored; click/drop replaces; clear aborts + idle                                 |
| AC14 | Raster upload → dropzone **Remove background** (not in Settings) → source becomes PNG cutout; preview/generate use it; SVG: action disabled; failure keeps prior file; no new API field |
