# OVARLY beta — New UI Handoff

_Resume point for the OVARLY hi-fi UI rebuild. Branch: `dev-new-ui`._

## Goal

Re-skin the **whole app** with the new OVARLY UI while keeping existing
functionality (clicks, pages, flows) working. Source of truth for the design is
the lo-fi grayscale wireframe repo at **`D:\User\OVARLY beta`** (`src/pages/wireframes/*`).
We build the hi-fi **colored** version in this repo (`D:\User\Studio\studio`).

- **Theme:** light. Brand blue **`#156EF4`**, black `#080808`, white `#FFF`.
- **Stack:** React 19 + react-router-dom (real URLs) + **Tailwind v4** (`@tailwindcss/vite`).

## How to run

```
npm install          # first time (node_modules is untracked)
npm run dev          # Vite on http://localhost:3000  (use 127.0.0.1 if localhost refuses)
```
Needs `.env.local` (already present, placeholder Supabase values so the UI renders):
`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## What's DONE ✅

- **Foundation:** `index.css` = Tailwind v4 `@theme` design tokens (`wire-*` names
  mirror the wireframes, values = OVARLY light palette + `brand-*`). Removed the old
  Tailwind CDN + importmap + dark body style from `index.html`.
- **Routing:** `ui/routes.ts` (full route map) + `ui/router.tsx` (all routes wired).
  `index.tsx` renders `RouterProvider`.
- **Shells:** `ui/AppShell.tsx` (sidebar + header, for global pages),
  `ui/WorkspaceShell.tsx` (tab bar + project menu, for in-project pages),
  `ui/HeaderControls.tsx` (bell + avatar popovers).
- **Shared kit:** `ui/kit.tsx` — `Button`, `Pill`, `SectionLabel`, `Card`.
- **All 25 screens** ported hi-fi in `ui/screens/*` (Dashboard is the gold-standard
  reference). Every route renders a real colored screen; navigation wired via `ROUTES`.
  Visually verified: Dashboard, Projects, Settings, Billing, Service Setup,
  Add SKUs Stored, Generation Canvas, Create Project modal, Look Editor.

## What's NOT done yet ⏳ (next phases, in order)

1. **UI review tweaks** — user will review all screens and request spacing/color/layout
   fixes. (Not visually verified yet: Notifications, Look Library, Assets Library,
   Brand Kits, Reports, Project Overview, Project Workspace, Props & Assets, Output,
   Review, Add SKU, SKU Review, Prepare SKU, Group SKU, Attach Look, empty variants.)
2. **Functionality wiring** — screens currently show static/mock data. Wire the REAL
   logic that lives in the legacy monolith `App.tsx` (+ `services/`, `types.ts`,
   `constants.ts`, `lib/supabase.ts`) into the new screens:
   - Supabase projects (`services/dbService.ts`) → Dashboard / Projects / Overview
   - SKU management + bulk generation → SKU flow + Generation Canvas
   - Gemini/Kie generation (`services/geminiService.ts`, `kieService.ts`) → Generation
   - History, image edit, color grading, ZIP downloads → Output / Generation
   Suggested start: Projects/Dashboard with real Supabase data first.
3. **Legacy cleanup** — once wired, remove old `App.tsx` monolith + superseded
   `components/*` (ImageUploadCard, HistoryCanvas, etc.) and old `pages/*`.

## Key files map

| New UI | Purpose |
|---|---|
| `index.css` | Tailwind v4 tokens (edit colors here) |
| `ui/routes.ts` | route path constants |
| `ui/router.tsx` | route → screen wiring |
| `ui/AppShell.tsx` / `ui/WorkspaceShell.tsx` | the two shells |
| `ui/kit.tsx` | shared Button/Pill/SectionLabel/Card |
| `ui/screens/*.tsx` | the 25 hi-fi screens |
| `App.tsx` (legacy, unmounted) | OLD monolith — reference for functionality to port |
| `services/`, `types.ts`, `constants.ts`, `lib/supabase.ts` | existing logic to reuse |

## Notes / gotchas

- `node_modules` is **untracked** (was committed on macOS; we `.gitignore`-honored it).
  Run `npm install` on a fresh clone.
- The wireframe repo (`D:\User\OVARLY beta`) also has design briefs: `handoff-note.md`,
  `01`–`05` markdown, `look-feature-build-brief.md`, `add-skus-stored-redesign-brief.md`,
  `prepare-skus-modal-redesign-brief.md`.
- Modals (Create Project, Attach Look, Prepare SKU, Group SKU) render as
  `fixed inset-0` scrim + centered card over their shell.
