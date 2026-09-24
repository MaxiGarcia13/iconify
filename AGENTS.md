# AGENTS.md — Iconify

Constitution for AI coding agents working in this repository.

## Product

**Iconify** — high-performance icon set generator (Astro + Sharp). One upload → favicons, PWA/Android, iOS, OG assets packaged as a streamed ZIP, plus a UI HTML `<head>` snippet.

## Source of Truth

1. [`SPEC.md`](./SPEC.md) — **product** decisions: goals, asset matrix, API contract, processing behavior, UI/UX, acceptance criteria
2. [`TASKS.md`](./TASKS.md) — sole implementation checklist (milestones M0–M5)
3. This file — durable **engineering** policy (stack, layout, coding, security practice)

When SPEC and code disagree, treat it as a defect. Prefer aligning code to SPEC unless the user explicitly changes requirements (then update SPEC first).

## SDD Workflow

1. Read relevant SPEC sections (product) and this file (engineering) before coding
2. Update SPEC if product requirements change
3. Mark / unmark items in `TASKS.md`
4. Implement against acceptance criteria in SPEC §7
5. Do not invent filenames, endpoints, or form fields not in SPEC

## Stack

| Layer   | Technology                                                          |
| ------- | ------------------------------------------------------------------- |
| UI      | Astro 7, Tailwind 4, client islands where interactivity is required |
| API     | Astro server endpoints under `src/pages/api/v1/`                    |
| Image   | Sharp                                                               |
| Package | archiver (ZIP stream)                                               |
| ICO     | multi-layer builder (e.g. `to-ico`); contract: PNG 16/32/48 → one `.ico` |

## Commands

```bash
npm run dev       # local server
npm run build     # production build
npm run preview   # preview build
npm run lint      # ESLint
npm run lint:fix  # ESLint autofix
npm run test:unit # Vitest unit tests
```

## Source layout

```text
src/
├── pages/
│   ├── index.astro                 # Generator UI
│   └── api/v1/generate.ts          # POST endpoint
├── components/
│   ├── generator.tsx               # Client island: dropzone + settings + download + snippet
│   ├── dropzone.tsx
│   ├── settings-panel.tsx
│   ├── html-snippet.tsx
│   └── footer.astro                # GitHub repository link
├── lib/
│   ├── icons/
│   │   ├── matrix.ts               # Asset matrix (sizes, names, presets)
│   │   ├── process.ts              # Sharp pipeline
│   │   ├── ico.ts                  # Multi-resolution ICO
│   │   └── package.ts              # ZIP stream assembly
│   ├── snippet.ts                  # HTML <head> generator (UI only)
│   ├── same-origin.ts              # Same-origin Origin check
│   ├── upload-constraints.ts       # Shared MIME / size checks
│   ├── generate-defaults.ts        # Shared GenerateOptions defaults (client-safe)
│   └── validate.ts                 # Multipart / option validation (server)
└── layouts/
    └── app.astro
```

## File naming

| Kind            | Rule                                     | Examples                                      |
| --------------- | ---------------------------------------- | --------------------------------------------- |
| Source          | lowercase kebab-case + extension         | `dropzone.tsx`, `upload-constraints.ts`       |
| Tests           | same basename + `.test` / `.spec` suffix | `upload-constraints.test.ts`                  |
| Docs / markdown | **UPPERCASE** basename + `.md`           | `SPEC.md`, `TASKS.md`, `AGENTS.md`            |
| Cursor rules    | lowercase kebab-case                     | `.cursor/rules/sdd.mdc`                       |

**Exceptions:** ZIP / product asset names from SPEC §2; npm/Node lockfiles; framework directory conventions (`node_modules`). Exported TypeScript / React symbols may use PascalCase or camelCase; only **file paths** are constrained.

## Architecture Rules

- Keep processing in `src/lib/`; pages/components stay thin
- API route: `POST /api/v1/generate` only (v1)
- Build all asset buffers first; then stream ZIP (no partial ZIP on failure)
- No persistent temp files for generated icons in v1
- Max upload 10 MB; MIME: SVG, PNG, JPEG only (SPEC §3)
- Asset names and sizes must match SPEC §2 exactly
- Request lifecycle: validate multipart → process all assets → stream ZIP; HTML snippet is UI-only (not in ZIP)

## Coding Standards

- TypeScript strict (Astro tsconfig)
- Prefer small, pure functions in the Sharp pipeline
- Validate multipart input before Sharp
- Return JSON errors with `{ error, message, details? }` shapes from SPEC §3
- Match existing file style; do not drive-by refactor unrelated files
- Do not add dependencies unless required by SPEC or explicitly requested
- Source file basenames: **lowercase kebab-case**; markdown docs: **UPPERCASE**

## Security

- Reject non-image uploads and oversize bodies
- `POST /api/v1/generate` is same-origin only (require matching `Origin`; no CORS) — SPEC §3.4
- Do not execute or eval SVG; pass through Sharp / sanitize for storage-in-ZIP only
- No secrets in repo; no logging of raw file contents

## Out of Scope (v1)

Batch uploads, auth, job queues, cloud storage, per-size manual editors, animated sources. (See also SPEC §1.2.)

## Cursor

Project rules live in `.cursor/rules/`. They reinforce this constitution and SPEC; they do not replace them.
