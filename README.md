# Iconify

High-performance icon set generator. Upload one SVG, PNG, or JPG and get favicons, Apple Touch icons, Android/PWA assets, an Open Graph image, and a copy-paste HTML `<head>` snippet.

Processing runs server-side with Sharp. Successful responses stream a ZIP (`application/zip`) — no intermediate icon files are written to disk.

Full requirements live in [`SPEC.md`](./SPEC.md). Implementation checklist: [`TASKS.md`](./TASKS.md). Agent policy: [`AGENTS.md`](./AGENTS.md).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321). Drop an image, adjust settings, then **Generate & Download ZIP**.

| Script              | Purpose             |
| ------------------- | ------------------- |
| `npm run dev`       | Local Astro server  |
| `npm run build`     | Production build    |
| `npm run preview`   | Preview the build   |
| `npm start`         | Run the Node server |
| `npm run test:unit` | Vitest unit tests   |

## UI workflow

1. Drop or browse an SVG / PNG / JPG (≤ 10 MB).
2. Optional: padding (0–50%), corner radius (0–100%), monochrome, background (`transparent` or hex), presets.
3. Generate → browser downloads `iconify-package.zip` and shows an HTML `<head>` snippet (copyable; not inside the ZIP).

Default presets: **all platforms + Original** (`all,original`).

## API

Private same-origin endpoint for the Iconify UI only. Requests must send an `Origin` header matching the site origin (browsers do this automatically for same-origin `fetch`). Cross-origin and missing `Origin` → `403 FORBIDDEN_ORIGIN`.

```http
POST /api/v1/generate
Content-Type: multipart/form-data
Origin: <same as request URL origin>
```

### Example

```bash
curl -X POST http://localhost:4321/api/v1/generate \
  -H "Origin: http://localhost:4321" \
  -F "file=@./logo.png" \
  -F "padding=10" \
  -F "cornerRadius=0" \
  -F "monochrome=false" \
  -F "background=transparent" \
  -F "presets=all,original" \
  -o iconify-package.zip
```

### Form fields

| Field          | Required | Default        | Notes                                                                   |
| -------------- | -------- | -------------- | ----------------------------------------------------------------------- |
| `file`         | yes      | —              | SVG, PNG, or JPEG; max 10 MB                                            |
| `background`   | no       | `transparent`  | Literal `transparent`, or `#RRGGBB` / `#RRGGBBAA`                       |
| `padding`      | no       | `0`            | 0–50 (% of shorter side)                                                |
| `cornerRadius` | no       | `0`            | 0–100 (% of half shorter side); `100` = full circle on square icons     |
| `monochrome`   | no       | `false`        | Literals `true` / `false` only                                          |
| `presets`      | no       | `all,original` | Comma-separated: `favicon`, `apple`, `android`, `og`, `original`, `all` |

`all` expands to favicon + apple + android + og only (not `original`). Combine `original` with other presets, or request it alone.

### Responses

| Status | Body                                                                             |
| ------ | -------------------------------------------------------------------------------- |
| `200`  | Streamed ZIP (`Content-Disposition: attachment; filename="iconify-package.zip"`) |
| `400`  | JSON `{ error: "VALIDATION_ERROR", message, details? }`                          |
| `403`  | JSON `{ error: "FORBIDDEN_ORIGIN", message }` (missing or cross-origin `Origin`) |
| `415`  | JSON `{ error: "UNSUPPORTED_MEDIA_TYPE", message }` (non-multipart)              |
| `500`  | JSON `{ error: "PROCESSING_ERROR", message }`                                    |

## Package contents

Deterministic filenames (SPEC §2). SVG-only entries (`favicon.svg`, `safari-pinned-tab.svg`) are omitted when the source is raster.

| Preset     | Assets                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| `favicon`  | `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, optional SVGs |
| `apple`    | `apple-touch-icon.png` (+ 152 / 167 / 180 sizes)                       |
| `android`  | `android-chrome-192x192.png`, `android-chrome-512x512.png`             |
| `og`       | `og-image.png` (1200×630)                                              |
| `original` | Upload basename at source width×height (processed PNG bytes)           |

## Constraints (v1)

- Max upload: 10 MB
- MIME: `image/svg+xml`, `image/png`, `image/jpeg`
- Extensions: `.svg`, `.png`, `.jpg`, `.jpeg`
- `POST /api/v1/generate` is same-origin only (UI); not a public third-party API
- No batch uploads, auth, job queues, or persistent temp icon files

## License

ISC
