# Iconify — Product Specification

| Field       | Value    |
| ----------- | -------- |
| **Product** | Iconify  |
| **Version** | 1.4.0    |
| **Status**  | Accepted |

Product requirements and decisions only. Engineering policy lives in [`AGENTS.md`](./AGENTS.md); work breakdown in [`TASKS.md`](./TASKS.md).

---

## 1. Product

Iconify turns one uploaded image (SVG, PNG, or JPG) into a complete icon package: favicons, Apple Touch icons, Android/PWA assets, Open Graph image, plus a copy-paste HTML `<head>` snippet in the UI. The user downloads a ZIP of the assets.

### 1.1 Goals

| ID  | Goal                                                                                     |
| --- | ---------------------------------------------------------------------------------------- |
| G1  | Generate a complete favicon / PWA / iOS / Android / OG set from one upload in seconds    |
| G2  | Deliver the package as a downloadable ZIP without leaving generated icons on disk        |
| G3  | Expose private generate + preview APIs for the product UI only (same origin; not public) |
| G4  | Focused UI: dropzone with live preview → settings → download ZIP + HTML snippet          |

### 1.2 Non-Goals (v1)

- Batch multi-file uploads
- Cloud storage / persistent job queues
- User accounts or history
- Custom per-size override editors
- Animated GIF / WebP animation sources
- Public or third-party use of the generate or preview APIs
- Server-side / API background removal (`removeBackground` is **not** a generate or preview multipart field; cutout is a client UI action only — §5.3.2)

---

## 2. Icon Assets

All raster outputs are PNG unless noted. Dimensions are width × height in pixels. Filenames are fixed so package membership is deterministic.

### 2.1 Modern Web / Favicons

| Filename                | Size                | Format | Use case                                              |
| ----------------------- | ------------------- | ------ | ----------------------------------------------------- |
| `favicon.ico`           | 16, 32, 48 (layers) | `.ico` | Legacy browsers / bookmarks                           |
| `favicon-16x16.png`     | 16×16               | `.png` | Explicit small favicon                                |
| `favicon-32x32.png`     | 32×32               | `.png` | Standard browser tab icon                             |
| `favicon.svg`           | scalable            | `.svg` | Modern browsers (source SVG only; otherwise omitted)  |
| `safari-pinned-tab.svg` | scalable            | `.svg` | Safari pinned tab (monochrome SVG when source is SVG) |

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

| Filename                      | Size                         | Format | Use case                              |
| ----------------------------- | ---------------------------- | ------ | ------------------------------------- |
| uploaded basename (see below) | source width × source height | `.png` | Processed export at upload dimensions |

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

## 3. API (product contract)

Private same-origin endpoints for the Iconify UI only (path prefix `/api/v1`).

### 3.1 Shared request fields

`multipart/form-data`. Visual options shared by generate and preview:

| Field          | Required | Default       | Meaning                                                                                                                                                                     |
| -------------- | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `file`         | yes      | —             | Source image (SVG, PNG, or JPG). Max 10 MB.                                                                                                                                 |
| `background`   | no       | `transparent` | Fill behind padded/resized icons: literal `transparent` or `#RRGGBB` / `#RRGGBBAA`.                                                                                         |
| `padding`      | no       | `0`           | Padding as % of the shorter side (0–50).                                                                                                                                    |
| `cornerRadius` | no       | `0`           | Outer corner radius as % of half the shorter canvas side (0–100). `0` = square; `100` = fully rounded. Applied to rasters only; does not alter SVG passthrough.             |
| `monochrome`   | no       | `false`       | Literals `true` / `false`. When true, greyscale raster content before compositing onto background (alpha kept; background color unchanged). Does not alter SVG passthrough. |

### 3.2 `POST /api/v1/generate`

Builds the ZIP package. Additional field:

| Field     | Required | Default        | Meaning                            |
| --------- | -------- | -------------- | ---------------------------------- |
| `presets` | no       | `all,original` | Comma-separated preset IDs (§2.6). |

| Code  | When                               | Body                                                                                                             |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `200` | Success                            | ZIP stream (`application/zip`); `Content-Disposition: attachment`; optional `X-Iconify-Assets` listing filenames |
| `400` | Missing/bad file, size, or options | JSON error                                                                                                       |
| `403` | Missing or cross-origin `Origin`   | JSON error                                                                                                       |
| `415` | Not `multipart/form-data`          | JSON error                                                                                                       |
| `500` | Processing / packaging failure     | JSON error                                                                                                       |

### 3.3 `POST /api/v1/preview`

Returns a single processed PNG for the dropzone live preview. Same visual fields as §3.1 (`file`, `background`, `padding`, `cornerRadius`, `monochrome`). **No** `presets` (presets only affect ZIP membership).

| Code  | When                               | Body                                                        |
| ----- | ---------------------------------- | ----------------------------------------------------------- |
| `200` | Success                            | PNG (`image/png`), square **256×256**, same treatment as §4 |
| `400` | Missing/bad file, size, or options | JSON error                                                  |
| `403` | Missing or cross-origin `Origin`   | JSON error                                                  |
| `415` | Not `multipart/form-data`          | JSON error                                                  |
| `500` | Processing failure                 | JSON error                                                  |

No ZIP; no persisted temp files. Preview must use the same processing rules as packaged rasters (§4).

### 3.4 Errors & constraints

Error JSON shape: `{ error, message, details? }` with `error` one of `VALIDATION_ERROR`, `PROCESSING_ERROR`, `UNSUPPORTED_MEDIA_TYPE`, `FORBIDDEN_ORIGIN`.

| Constraint    | Value                                            |
| ------------- | ------------------------------------------------ |
| Max upload    | 10 MB                                            |
| Allowed types | SVG, PNG, JPEG (`.svg`, `.png`, `.jpg`, `.jpeg`) |
| Versioning    | Path prefix `/api/v1`                            |
| Access        | Same-origin UI only (§3.5)                       |

### 3.5 Same-origin access

Both generate and preview are private to the Iconify UI on the same origin.

- Request must include `Origin` equal to the request URL origin (scheme + host + port).
- Otherwise → `403` with `FORBIDDEN_ORIGIN`.
- No CORS (`Access-Control-Allow-Origin` must not be set).

This is abuse/CSRF mitigation for browsers, not authentication.

---

## 4. Processing behavior

Product rules for how the source becomes assets (implementation details are out of scope here):

| Rule            | Behavior                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| SVG input       | Keep `favicon.svg` (and optional pinned-tab) as SVG; rasters derived from source                                     |
| Raster input    | Omit SVG outputs; still produce PNG/ICO targets                                                                      |
| Transparency    | Default background transparent; PNG keeps alpha; ICO may flatten                                                     |
| Padding         | Uniform % inset; content fitted inside the padded box                                                                |
| Corner radius   | Rounded outer canvas on rasters; no-op at `0`; skip SVG passthrough                                                  |
| Monochrome      | Greyscale raster content when enabled; skip SVG passthrough                                                          |
| Original preset | Native-size PNG; ZIP name = upload basename; not part of `all`                                                       |
| Failure         | Any processing failure → `500`; never start a ZIP after a mid-pipeline failure (build all assets first, then stream) |

---

## 5. UI / UX

Single page: `/`. Flow: dropzone (live preview) → settings → generate → ZIP download + HTML snippet.

### 5.1 Layout (conceptual)

```text
┌─────────────────────────────────────────────────────────┐
│  Brand + short product description                      │
├────────────────────────────┬────────────────────────────┤
│  Dropzone + live preview   │  Settings                   │
│  drag/drop, browse         │  padding, corner radius,    │
│  Remove background · Clear │  monochrome, background,    │
│  (settings reflected)      │  presets                    │
├────────────────────────────┴────────────────────────────┤
│  [ Generate & Download ZIP ]                             │
├─────────────────────────────────────────────────────────┤
│  HTML <head> snippet                    [ Copy ]         │
├─────────────────────────────────────────────────────────┤
│  Footer: link to GitHub repository                       │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Workflow

| Step | Actor | Behavior                                                                                         |
| ---- | ----- | ------------------------------------------------------------------------------------------------ |
| 1    | User  | Drops/selects SVG/PNG/JPG ≤ 10 MB                                                                |
| 2    | UI    | Validates; shows live preview + file meta; enables settings                                      |
| 3    | User  | Optionally **Remove background** on a raster source (§5.3.2); UI replaces source with PNG cutout |
| 4    | User  | Adjusts settings / presets; preview updates for visual options (§5.3.1)                          |
| 5    | User  | Optionally replaces source (click preview or drop another file)                                  |
| 6    | UI    | Replaces preview with the new file; current settings stay applied                                |
| 7    | User  | Clicks **Generate & Download ZIP**                                                               |
| 8    | UI    | Calls generate API; shows progress / disabled state                                              |
| 9    | UI    | On success: browser download + populate snippet                                                  |
| 10   | UI    | On error: show inline message from API                                                           |

### 5.3 Controls

| Control           | Default        | Notes                                                           |
| ----------------- | -------------- | --------------------------------------------------------------- |
| Padding           | `0`            | 0–50, `%` (Settings)                                            |
| Corner radius     | `0`            | 0–100, `%` of half shorter side (Settings)                      |
| Monochrome        | off            | Greyscale rasters only (Settings)                               |
| Background        | transparent    | Transparent or `#RRGGBB` (Settings)                             |
| Presets           | all + Original | Original default-on with `all`; independent of `all` (Settings) |
| Remove background | —              | Dropzone action only (§5.3.2); not a Settings control           |
| Clear             | —              | Dropzone action; removes source and restores empty prompt       |

Dropzone accepts the same types/size as the API. Generate disabled until a valid file is present. Errors announced for assistive tech. Settings and dropzone are interaction surfaces (not decorative cards).

### 5.3.1 Live preview (dropzone)

When a valid source file is selected, the dropzone shows a **live visual preview** from `POST /api/v1/preview` (§3.3) — the same processing as packaged rasters, not a client-side approximation.

| Rule             | Behavior                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Show on select   | After successful validation, request a preview and show the returned PNG in the dropzone                                                                              |
| Reflect settings | Re-request preview when `padding`, `cornerRadius`, `monochrome`, or `background` change                                                                               |
| Debounce         | Debounce preview requests while settings change so rapid slider input does not flood the API                                                                          |
| Cancel in-flight | If the user changes settings (or replaces/clears the file) after a preview request has already been sent, **abort** that pending request before starting the next one |
| Presets          | Preset checkboxes do **not** trigger preview (they only select ZIP membership)                                                                                        |
| Fidelity         | Server PNG at 256×256 using §4 treatment (pad, background, corner radius, monochrome)                                                                                 |
| Stale responses  | Aborted or superseded responses must not update the UI                                                                                                                |
| Replace          | Clicking the preview opens the file picker; dropping another valid file replaces the source. Current settings remain and apply to the new file                        |
| Clear            | Clear removes the file, restores the empty dropzone prompt, aborts any pending preview, and hides the preview                                                         |
| No file          | Empty / error states keep the existing dropzone prompts; no preview                                                                                                   |

Preview does not write ZIP assets. Generate remains a separate action (§3.2).

### 5.3.2 Remove background (dropzone)

Optional **client-side** action on the dropzone (alongside Clear) — **not** in Settings and **not** an API option. Runs entirely in the browser with `@imgly/background-removal` (browser package only; not the Node package). The cutout becomes the new source `File`. Generate and preview then process that file with the existing §3 / §4 contract (no `removeBackground` multipart field).

| Rule            | Behavior                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placement       | Dropzone action bar (e.g. next to Clear); never a Settings control                                                                                         |
| Eligibility     | Enabled only for a valid **raster** source (PNG / JPG). Disabled or hidden for SVG; disabled when no file or while removal / generate / preview is pending |
| On success      | Replace the source with a **PNG with alpha** (foreground cutout). Keep current settings. Live preview re-fetches for the new file (§5.3.1)                 |
| Basename        | Preserve a sensible upload stem as `.png` (e.g. `logo.jpg` → `logo.png`, or an explicit `-nobg.png` stem). Bytes are always PNG                            |
| Progress        | Show pending state while removal runs; announce for assistive tech                                                                                         |
| Failure         | Inline / `aria-live` error; **keep** the prior source file; do not clear the dropzone                                                                      |
| Undo            | Optional: keep the pre-removal file until Clear, replace, or another successful remove; **Undo** restores it                                               |
| Clear / replace | Abort in-flight removal; discard any undo buffer; Clear restores the empty prompt as in §5.3.1                                                             |
| Privacy         | Source image stays in the browser for this step; no dedicated remove-background API                                                                        |

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

| ID   | Criterion                                                                                                                                                                                                                                                                                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1  | Upload PNG ≤ 10 MB with preset `all` returns ZIP containing every §2.1–2.4 file (SVG outputs excluded)                                                                                                                                                                                                                                                                                               |
| AC2  | Upload SVG returns ZIP that also includes `favicon.svg`                                                                                                                                                                                                                                                                                                                                              |
| AC3  | Invalid MIME or >10 MB returns `400` with `VALIDATION_ERROR`                                                                                                                                                                                                                                                                                                                                         |
| AC4  | `padding=20` visibly insets icon content in generated PNG assets                                                                                                                                                                                                                                                                                                                                     |
| AC5  | `favicon.ico` contains 16, 32, and 48 px layers                                                                                                                                                                                                                                                                                                                                                      |
| AC6  | UI can download ZIP and copy `<head>` snippet in one session without reload                                                                                                                                                                                                                                                                                                                          |
| AC7  | No intermediate icon files persist on disk after the request completes                                                                                                                                                                                                                                                                                                                               |
| AC8  | `cornerRadius=100` on a square PNG yields circular rasters; `0` leaves square corners; invalid values return `400 VALIDATION_ERROR`                                                                                                                                                                                                                                                                  |
| AC9  | Document head on `/` wires §5.5 public icons, manifest, theme-color, absolute OG/Twitter for `/og-image.png`, and canonical / `og:url`                                                                                                                                                                                                                                                               |
| AC10 | `monochrome=true` yields greyscale raster PNG/ICO content; `false`/omitted keeps source colors; invalid → `400`; SVG passthrough unchanged                                                                                                                                                                                                                                                           |
| AC11 | Omit `presets` → `all,original`; `original` alone → ZIP with only upload basename at source size; options still apply; explicit `all` omits original; combining `original` with other presets adds the upload-named file                                                                                                                                                                             |
| AC12 | Missing or mismatched `Origin` on generate or preview → `403 FORBIDDEN_ORIGIN`; matching same-origin proceeds; no `Access-Control-Allow-Origin`                                                                                                                                                                                                                                                      |
| AC13 | Valid upload shows a live preview from `POST /api/v1/preview` (256×256 PNG); padding / corner radius / monochrome / background re-fetch a debounced preview; an in-flight preview is **aborted** when settings/file change again; presets do not; aborted/stale responses do not update the UI; click or drop replaces the source while keeping settings; clear aborts and restores the empty prompt |
| AC14 | Raster upload exposes dropzone **Remove background** (not in Settings); success replaces source with a PNG cutout and preview/generate use it with current settings; SVG: action disabled/hidden; failure keeps the prior file; no `removeBackground` (or equivalent) field on generate or preview                                                                                                   |

---

## 8. Governance

1. **SPEC is product truth.** Do not invent API fields, asset names, sizes, or status codes outside this document.
2. **Spec before code.** Change requirements here first; adjust `TASKS.md` if the work breakdown changes; then implement.
3. **Drift is a defect.** Prefer aligning code to SPEC unless the SPEC change is intentional.
4. **Engineering conventions** live in [`.cursor/rules/`](./.cursor/rules/) and the short orientation in [`AGENTS.md`](./AGENTS.md).

---

## Document History

| Version | Date       | Notes                                                                   |
| ------- | ---------- | ----------------------------------------------------------------------- |
| 1.0.x   | 2026-07    | Technical specification (API samples, Sharp/UI code, layout)            |
| 1.1.0   | 2026-09-24 | Slimmed to product decisions; engineering moved to `AGENTS.md`          |
| 1.2.0   | 2026-09-24 | Live dropzone preview reflecting visual settings (§5.3.1)               |
| 1.3.0   | 2026-09-24 | Server preview API `POST /api/v1/preview` + debounced UI (AC13)         |
| 1.3.1   | 2026-09-24 | Abort in-flight preview when user changes settings again                |
| 1.4.0   | 2026-09-24 | Client dropzone **Remove background** (§5.3.2 / AC14); not an API field |
