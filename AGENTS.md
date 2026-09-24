# AGENTS.md — Iconify

Orientation for AI coding agents. Product truth: [`SPEC.md`](./SPEC.md). Checklist: [`TASKS.md`](./TASKS.md). Conventions: `.cursor/rules/`.

## Product

**Iconify** — one upload → favicons, PWA/Android, iOS, OG assets as a streamed ZIP, plus a UI HTML `<head>` snippet.

When SPEC and code disagree, treat it as a defect. Prefer aligning code to SPEC unless the user changes requirements (then update SPEC first).

## Stack

| Layer   | Technology                        |
| ------- | --------------------------------- |
| UI      | Astro 7, Tailwind 4, client islands |
| API     | Astro routes under `src/pages/api/v1/` |
| Image   | Sharp                             |
| Package | archiver (ZIP stream)             |
| ICO     | multi-layer (e.g. `to-ico`)       |

## Commands

```bash
npm run dev        # local server
npm run build      # production build
npm run preview    # preview build
npm run lint       # ESLint
npm run lint:fix   # ESLint autofix
npm run test:unit  # Vitest
```
