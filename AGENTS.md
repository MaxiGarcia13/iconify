# AGENTS.md — Iconify

Constitution for AI coding agents working in this repository.

## Product

**Iconify** — high-performance icon set generator (Astro + Sharp). One upload → favicons, PWA/Android, iOS, OG assets, `site.webmanifest`, and HTML snippets packaged as a streamed ZIP.

## Source of Truth

1. [`SPEC.md`](./SPEC.md) — product, API, asset matrix, processing, UI, acceptance criteria
2. [`TASKS.md`](./TASKS.md) — sole implementation checklist (milestones M0–M5)
3. This file — durable engineering policy

When SPEC and code disagree, treat it as a defect. Prefer aligning code to SPEC unless the user explicitly changes requirements (then update SPEC first).

## SDD Workflow

1. Read relevant SPEC sections before coding
2. Update SPEC (and OpenAPI block) if requirements change
3. Mark / unmark items in `TASKS.md`
4. Implement against acceptance criteria in SPEC §7
5. Do not invent filenames, endpoints, or form fields not in SPEC

## Stack

| Layer | Technology |
| --- | --- |
| UI | Astro 7, Tailwind 4, client islands where interactivity is required |
| API | Astro server endpoints under `src/pages/api/v1/` |
| Image | Sharp |
| Package | archiver (ZIP stream) |
| ICO | multi-layer builder per SPEC §4 |

## Commands

```bash
npm run dev       # local server
npm run build     # production build
npm run preview   # preview build
npm run lint      # ESLint
npm run lint:fix  # ESLint autofix
npm run test:unit # Vitest unit tests
```

## Architecture Rules

- Keep processing in `src/lib/`; pages/components stay thin
- API route: `POST /api/v1/generate` only (v1)
- Build all asset buffers first; then stream ZIP (no partial ZIP on failure)
- No persistent temp files for generated icons in v1
- Max upload 10 MB; MIME: SVG, PNG, JPEG only
- Asset names and sizes must match SPEC §2 exactly

## Coding Standards

- TypeScript strict (Astro tsconfig)
- Prefer small, pure functions in the Sharp pipeline
- Validate multipart input before Sharp
- Return JSON errors with `{ error, message, details? }` shapes from SPEC
- Match existing file style; do not drive-by refactor unrelated files
- Do not add dependencies unless required by SPEC or explicitly requested

## Security

- Reject non-image uploads and oversize bodies
- Do not execute or eval SVG; pass through Sharp / sanitize for storage-in-ZIP only
- No secrets in repo; no logging of raw file contents

## Out of Scope (v1)

Batch uploads, auth, job queues, cloud storage, per-size manual editors, animated sources.

## Cursor

Project rules live in `.cursor/rules/`. They reinforce this constitution and SPEC; they do not replace them.
