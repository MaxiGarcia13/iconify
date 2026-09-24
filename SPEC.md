# Iconify — Product Specification

| Field       | Value    |
| ----------- | -------- |
| **Product** | Iconify  |
| **Version** | 1.1.0    |
| **Status**  | Accepted |

Product requirements and decisions only. Engineering policy lives in [`AGENTS.md`](./AGENTS.md); work breakdown in [`TASKS.md`](./TASKS.md).

---

## 1. Product

Iconify turns one uploaded image (SVG, PNG, or JPG) into a complete icon package: favicons, Apple Touch icons, Android/PWA assets, Open Graph image, plus a copy-paste HTML `<head>` snippet in the UI. The user downloads a ZIP of the assets.

### 1.1 Goals

| ID  | Goal                                                                                    |
| --- | --------------------------------------------------------------------------------------- |
| G1  | Generate a complete favicon / PWA / iOS / Android / OG set from one upload in seconds    |
| G2  | Deliver the package as a downloadable ZIP without leaving generated icons on disk        |
| G3  | Expose a private generate API for the product UI only (same origin; not a public API)    |
| G4  | Focused UI: dropzone → settings → download ZIP + HTML snippet                            |

### 1.2 Non-Goals (v1)

- Batch multi-file uploads
- Cloud storage / persistent job queues
- User accounts or history
- Custom per-size override editors
- Animated GIF / WebP animation sources
- Public or third-party use of the generate API

---

## 2. Icon Assets

All raster outputs are PNG unless noted. Dimensions are width × height in pixels. Filenames are fixed so package membership is deterministic.

### 2.1 Modern Web / Favicons

| Filename                | Size                | Format | Use case                                             |
| ----------------------- | ------------------- | ------ | ---------------------------------------------------- |
| `favicon.ico`           | 16, 32, 48 (layers) | `.ico` | Legacy browsers / bookmarks                          |
| `favicon-16x16.png`     | 16×16               | `.png` | Explicit small favicon                               |
| `favicon-32x32.png`     | 32×32               | `.png` | Standard browser tab icon                            |
| `favicon.svg`           | scalable            | `.svg` | Modern browsers (source SVG only; otherwise omitted) |
| `safari-pinned-tab.svg` | scalable            | `.svg` | Safari pinned tab (monochrome SVG when source is SVG)|

### 2.2 iOS / Apple Touch

| Filename                       | Size    | Format | Use case         |
| ------------------------------ | ------- | ------ | ---------------- |
| `apple-touch-icon-152x152.png` | 152×152 | `.png` | iPad (iOS 7+)    |
| `apple-touch-icon-167x167.png` | 167×167 | `.png` | iPad Pro         |
| `apple-touch-icon-180x180.png` | 180×180 | `.png` | iPhone (primary) |
| `apple-touch-icon.png`         | 180×180 | `.png` | Default alias    |

### 2.3 Android / PWA

| Filename                     | Size    | Format | Use case                  |
| ---------------------------- | ------- | ------ | ------------------------- |
| `android-chrome-192x192.png` | 192×192 | `.png` | Android home screen / PWA |
| `android-chrome-512x512.png` | 512×512 | `.png` | Splash / maskable base    |

### 2.4 Open Graph / Social

| Filename       | Size     | Format | Use case                          |
| -------------- | -------- | ------ | --------------------------------- |
| `og-image.png` | 1200×630 | `.png` | Open Graph / Twitter card preview |

### 2.5 Original size

One raster export at the source image’s native pixel dimensions, with the same padding / background / corner-radius / monochrome settings as other assets (no resize to a fixed matrix size). Non-square sources stay non-square.

| Filename                      | Size                         | Format | Use case                                  |
| ----------------------------- | ---------------------------- | ------ | ----------------------------------------- |
| uploaded basename (see below) | source width × source height | `.png` | Processed export at upload dimensions     |

**ZIP entry name:** upload basename (path stripped), e.g. `logo.png` → `logo.png`, `Brand/Icon.JPG` → `Icon.JPG`. Bytes are always processed PNG (extension may not match when the upload was JPEG/SVG). On collision with another package asset, insert `-original` before the extension. Empty/unsafe basename → `original.png`. If source dimensions are unavailable → processing failure.

### 2.6 Presets

Clients may request subsets via `presets` (comma-separated or repeated):

| Preset ID  | Includes                                        |
| ---------- | ----------------------------------------------- |
| `favicon`  | §2.1                                            |
| `apple`    | §2.2                                            |
| `android`  | §2.3                                            |
| `og`       | §2.4                                            |
| `original` | §2.5                                            |
| `all`      | §2.1–§2.4 only; does **not** include `original` |

`original` is independent of `all`. Default when `presets` is omitted: `all,original`. Explicit `presets=all` omits the original-size file.

### 2.7 Package contents (example)

```text
iconify-package/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── favicon.svg                    # if source was SVG
├── apple-touch-icon.png
├── apple-touch-icon-152x152.png
├── apple-touch-icon-167x167.png
├── apple-touch-icon-180x180.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
├── og-image.png
└── <upload-basename>              # if presets includes original
```

---

## 3. Generate API (product contract)

Single private endpoint for the Iconify UI: `POST /api/v1/generate`.

### 3.1 Request

`multipart/form-data` with:

| Field          | Required | Default        | Meaning                                                                 |
| -------------- | -------- | -------------- | ----------------------------------------------------------------------- |
| `file`         | yes      | —              | Source image (SVG, PNG, or JPG). Max 10 MB.                             |
| `background`   | no       | `transparent`  | Fill behind padded/resized icons: literal `transparent` or `#RRGGBB` / `#RRGGBBAA`. |
| `padding`      | no       | `0`            | Padding as % of the shorter side (0–50).                                |
| `cornerRadius` | no       | `0`            | Outer corner radius as % of half the shorter canvas side (0–100). `0` = square; `100` = fully rounded. Applied to rasters only; does not alter SVG passthrough. |
| `monochrome`   | no       | `false`        | Literals `true` / `false`. When true, greyscale raster content before compositing onto background (alpha kept; background color unchanged). Does not alter SVG passthrough. |
| `presets`      | no       | `all,original` | Comma-separated preset IDs (§2.6).                                      |

### 3.2 Response

| Code  | When                                           | Body                 |
| ----- | ---------------------------------------------- | -------------------- |
| `200` | Success                                        | ZIP stream (`application/zip`); `Content-Disposition: attachment`; optional `X-Iconify-Assets` listing filenames |
| `400` | Missing/bad file, size, or options             | JSON error           |
| `403` | Missing or cross-origin `Origin`               | JSON error           |
| `415` | Not `multipart/form-data`                      | JSON error           |
| `500` | Processing / packaging failure                 | JSON error           |

Error JSON shape: `{ error, message, details? }` with `error` one of `VALIDATION_ERROR`, `PROCESSING_ERROR`, `UNSUPPORTED_MEDIA_TYPE`, `FORBIDDEN_ORIGIN`.

### 3.3 Constraints

| Constraint      | Value                                      |
| --------------- | ------------------------------------------ |
| Max upload      | 10 MB                                      |
| Allowed types   | SVG, PNG, JPEG (`.svg`, `.png`, `.jpg`, `.jpeg`) |
| Response        | Streamed ZIP; no persisted temp icon files |
| Versioning      | Path prefix `/api/v1`                      |
| Access          | Same-origin UI only (§3.4)                 |

### 3.4 Same-origin access

The generate endpoint is private to the Iconify UI on the same origin.

- Request must include `Origin` equal to the request URL origin (scheme + host + port).
- Otherwise → `403` with `FORBIDDEN_ORIGIN`.
- No CORS (`Access-Control-Allow-Origin` must not be set).

This is abuse/CSRF mitigation for browsers, not authentication.

---

## 4. Processing behavior

Product rules for how the source becomes assets (implementation details are out of scope here):

| Rule            | Behavior                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| SVG input       | Keep `favicon.svg` (and optional pinned-tab) as SVG; rasters derived from source |
| Raster input    | Omit SVG outputs; still produce PNG/ICO targets                          |
| Transparency    | Default background transparent; PNG keeps alpha; ICO may flatten         |
| Padding         | Uniform % inset; content fitted inside the padded box                    |
| Corner radius   | Rounded outer canvas on rasters; no-op at `0`; skip SVG passthrough      |
| Monochrome      | Greyscale raster content when enabled; skip SVG passthrough              |
| Original preset | Native-size PNG; ZIP name = upload basename; not part of `all`           |
| Failure         | Any processing failure → `500`; never start a ZIP after a mid-pipeline failure (build all assets first, then stream) |

---

## 5. UI / UX

Single page: `/`. Flow: dropzone → settings → generate → ZIP download + HTML snippet.

### 5.1 Layout (conceptual)

```text
┌─────────────────────────────────────────────────────────┐
│  Brand + short product description                      │
├────────────────────────────┬────────────────────────────┤
│  Dropzone                  │  Settings                   │
│  drag/drop, browse, clear  │  padding, corner radius,    │
│                            │  monochrome, background,    │
│                            │  presets                    │
├────────────────────────────┴────────────────────────────┤
│  [ Generate & Download ZIP ]                             │
├─────────────────────────────────────────────────────────┤
│  HTML <head> snippet                    [ Copy ]         │
├─────────────────────────────────────────────────────────┤
│  Footer: link to GitHub repository                       │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Workflow

| Step | Actor | Behavior                                                                        |
| ---- | ----- | ------------------------------------------------------------------------------- |
| 1    | User  | Drops/selects SVG/PNG/JPG ≤ 10 MB                                               |
| 2    | UI    | Validates; shows file meta; enables settings                                    |
| 3    | User  | Adjusts settings / presets                                                      |
| 4    | User  | Clicks **Generate & Download ZIP**                                              |
| 5    | UI    | Calls generate API; shows progress / disabled state                             |
| 6    | UI    | On success: browser download + populate snippet                                 |
| 7    | UI    | On error: show inline message from API                                          |

### 5.3 Controls

| Control       | Default        | Notes                                                                 |
| ------------- | -------------- | --------------------------------------------------------------------- |
| Padding       | `0`            | 0–50, `%`                                                             |
| Corner radius | `0`            | 0–100, `%` of half shorter side                                       |
| Monochrome    | off            | Greyscale rasters only                                                |
| Background    | transparent    | Transparent or `#RRGGBB`                                              |
| Presets       | all + Original | Original default-on with `all`; independent of `all`                  |

Dropzone accepts the same types/size as the API. Generate disabled until a valid file is present. Errors announced for assistive tech. Settings and dropzone are interaction surfaces (not decorative cards).

### 5.4 HTML snippet (UI only)

Copy-paste markup shown after a successful generate; **not** included in the ZIP. Omit the SVG favicon link when the source was not SVG:

```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<meta property="og:image" content="/og-image.png" />
```

### 5.5 Product site head (SEO & social)

The product page document (not the ZIP snippet) should expose:

- Favicons / Apple Touch / Android icons and `site.webmanifest` already shipped under `public/`
- Core SEO: title, description, keywords, canonical URL of `/`
- Open Graph + Twitter Card with absolute URLs (including `/og-image.png` at 1200×630)
- Manifest + theme color aligned with the site canvas (`#141826`)

Do not invent new asset filenames for the document head.

---

## 6. Milestones

Implementation progress: [`TASKS.md`](./TASKS.md). Update this SPEC when product requirements change; update `TASKS.md` for work items.

A task is done only when its acceptance criteria are met and unit tests for that slice pass.

---

## 7. Acceptance Criteria

| ID   | Criterion |
| ---- | --------- |
| AC1  | Upload PNG ≤ 10 MB with preset `all` returns ZIP containing every §2.1–2.4 file (SVG outputs excluded) |
| AC2  | Upload SVG returns ZIP that also includes `favicon.svg` |
| AC3  | Invalid MIME or >10 MB returns `400` with `VALIDATION_ERROR` |
| AC4  | `padding=20` visibly insets icon content in generated PNG assets |
| AC5  | `favicon.ico` contains 16, 32, and 48 px layers |
| AC6  | UI can download ZIP and copy `<head>` snippet in one session without reload |
| AC7  | No intermediate icon files persist on disk after the request completes |
| AC8  | `cornerRadius=100` on a square PNG yields circular rasters; `0` leaves square corners; invalid values return `400 VALIDATION_ERROR` |
| AC9  | Document head on `/` wires §5.5 public icons, manifest, theme-color, absolute OG/Twitter for `/og-image.png`, and canonical / `og:url` |
| AC10 | `monochrome=true` yields greyscale raster PNG/ICO content; `false`/omitted keeps source colors; invalid → `400`; SVG passthrough unchanged |
| AC11 | Omit `presets` → `all,original`; `original` alone → ZIP with only upload basename at source size; options still apply; explicit `all` omits original; combining `original` with other presets adds the upload-named file |
| AC12 | Missing or mismatched `Origin` → `403 FORBIDDEN_ORIGIN`; matching same-origin proceeds; no `Access-Control-Allow-Origin` |

---

## 8. Governance

1. **SPEC is product truth.** Do not invent API fields, asset names, sizes, or status codes outside this document.
2. **Spec before code.** Change requirements here first; adjust `TASKS.md` if the work breakdown changes; then implement.
3. **Drift is a defect.** Prefer aligning code to SPEC unless the SPEC change is intentional.
4. **Engineering conventions** live in [`.cursor/rules/`](./.cursor/rules/) and the short orientation in [`AGENTS.md`](./AGENTS.md).

---

## Document History

| Version | Date       | Notes |
| ------- | ---------- | ----- |
| 1.0.x   | 2026-07    | Technical specification (API samples, Sharp/UI code, layout) |
| 1.1.0   | 2026-09-24 | Slimmed to product decisions; engineering moved to `AGENTS.md` |
