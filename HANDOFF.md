# OVARLY beta — New UI Handoff

_Resume point for the OVARLY hi-fi UI rebuild. Branch: `dev-new-ui`._

> **Last worked: 2026-07-05.** Phase 1 (all 25 screens hi-fi) is committed. Phase 2
> (wiring real Supabase functionality) is **in progress and UNCOMMITTED** in the working
> tree — see **"Phase 2 progress"** below for exactly what's live and what's next.

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
Needs `.env.local`. **Real Supabase creds are now in it** (project `sdkzparmcifhhgedauyt`,
publishable key `sb_publishable_…`; tables live in the `mvp` schema). `GEMINI_API_KEY` is
still empty. Dev server: port 3000 is often busy → **Vite falls back to 3001**.

> ⚠️ **STORAGE WRITE BLOCKER** — the anon/publishable key can read+write **tables** and
> **read** storage (buckets are public-read), but **cannot write to Storage buckets**
> (`403 new row violates row-level security policy`). This blocks ALL image writes: SKU
> image upload, project-asset upload, saving generated images. The app has **no Supabase
> Auth** (anon-only). **Fix = add a Storage RLS policy** in the Supabase dashboard allowing
> `anon` to insert/update on buckets `project-assets` + `generated-images`, e.g.:
> ```sql
> create policy "anon write project-assets" on storage.objects
>   for insert to anon with check (bucket_id = 'project-assets');
> create policy "anon modify project-assets" on storage.objects
>   for update to anon using (bucket_id = 'project-assets');
> create policy "anon write generated-images" on storage.objects
>   for insert to anon with check (bucket_id = 'generated-images');
> ```

## Phase 2 progress (real Supabase wiring) — UNCOMMITTED

**New shared data layer**
- `ui/data/projects.tsx` — `ProjectsProvider` + `useProjects()`. Loads real projects
  (`db.loadProjects`) + SKU counts (`db.loadSkuCounts`, one query). Exposes loading/error,
  `select` (active project, persisted to `sessionStorage['ovarly.selectedProject']`), and
  persisting mutators `create` / `remove` / `rename` / `duplicate`. **Archive is a
  client-side overlay** (no status column in DB). `toVM()` maps DB `Project` → card fields:
  `shots.length>0 ? "active" : "draft"`, services = `shots.length`, skus = live count,
  edited = `relativeTime(createdAt)`.
- `ui/data/skus.tsx` — `SkusProvider` + `useSkus()` (mounted in `WorkspaceShell`). Loads
  `db.loadSkuSummaries(selectedId)` (lightweight; slot_keys + a `thumbUrl`, no base64).
  `addFromFiles()` creates a SKU per uploaded image (saveSKU + uploadSKUAsset); `remove()`
  deletes. On a storage 403 it rolls back + deletes the orphan row and surfaces `error`.
- `services/dbService.ts` — added `loadSkuCounts()` and `loadSkuSummaries()` (with thumbUrl).
- `ui/router.tsx` — a `RootLayout` wraps both shells in `<ProjectsProvider>`.

**Wired & verified live (puppeteer-driving real Chrome):**
- **Projects** — real cards/list, search/sort/view, delete(confirm)/rename/duplicate persist,
  archive local. Loading + error states.
- **Dashboard** — Continue working / Recent / Drafts / Archived count all from real data.
- **Create → Open loop** — CreateProject builds a real `Project` (category TOP, model
  ECOM_SHOOT, no shots → Draft), persists, opens in workspace. `WorkspaceShell` tab +
  `ProjectOverview` header show the real selected project.
- **SKUs list** (`AddSkuStored`) — real SKUs with **real thumbnails**, image counts, angle
  presence (front/back/detail from slot_keys), real category, search/filter, delete persists,
  archive local. SKU upload create is **code-complete but blocked** by the storage wall above
  (shows the error banner).
- **Props & Assets** (`PropsAssets`) — **read-only, DONE + verified** (2026-07-07). Shows the
  selected project's real `project_assets` grouped into sections (Character Face / Garment /
  Bottoms / Footwear / Accessories / Backgrounds; unmapped slot_keys fall into a trailing
  "Other" group). Real thumbnails via new `db.loadProjectAssetSummaries` (public URLs, no
  base64 — mirrors `loadSkuSummaries`). Context note shows the real project category. Loading /
  no-project / empty-group states handled. Verified live on Dressberry (24 assets → 2/9/6/1/1/5).
  Upload is intentionally NOT wired (display-only) until the storage-write blocker is fixed.
  `PropsAssetsUploaded` route now just renders the same real screen.

**Data caveats (matter for next steps):**
- Generation history: 11 batches / 67 images, but ~half have `storage_path=null` and others
  store an **external Kie temp URL** (`tempfile.aiquickdraw.com`, likely expired) — a
  generation gallery must handle null / full-URL / bucket-path cases.
- `projects` has **no** status/service-types columns. **Service Setup** models Service Types +
  per-type Looks → richer than the DB; needs schema/product decisions, not just plumbing.
- **No tables** for looks / assets / brand_kits / reports / notifications / billing → those
  screens are pure mock with no backing data.

**Next (resume here):** (a) unblock storage writes (policy above) → re-verify SKU upload +
generation/asset saves + wire Props & Assets upload; (b) ~~Props & Assets read-only~~ **DONE
2026-07-07** (see above); (c) **generation output gallery** (`Output.tsx` — handle the URL
caveat: null paths skip, full-URL use as-is, bucket paths via publicUrl); (d) legacy cleanup:
delete old `App.tsx` + superseded `components/*`, `pages/*`. `puppeteer-core` is installed
`--no-save` (node_modules only) for E2E verification (drive real Chrome, use
`waitUntil: 'domcontentloaded'` — Vite's HMR socket blocks `networkidle`).

## What's DONE ✅ — Phase 1 (committed baseline)

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

## What's NOT done yet ⏳

> **Functionality wiring is underway — see "Phase 2 progress" above** for what's live
> (Projects, Dashboard, Create→Open, SKUs list) and the ordered next steps.

Still fully mock / not wired:
- **Service Setup, Props & Assets, Generation Canvas, Output, Review, Prepare SKU,
  Group SKU, Attach Look, Look Editor.**
- **Look Library, Assets Library, Brand Kits, Reports, Notifications, Billing** — no
  backing DB tables exist, so these need a data model before wiring.
- **Generation** (`services/geminiService.ts`, `kieService.ts`) — needs `GEMINI_API_KEY`
  and storage writes (both currently missing/blocked).
- **Legacy cleanup** — once enough is wired, remove old `App.tsx` monolith + superseded
  `components/*` (ImageUploadCard, HistoryCanvas, etc.) and old `pages/*`.

## Key files map

| New UI | Purpose |
|---|---|
| `index.css` | Tailwind v4 tokens (edit colors here) |
| `ui/routes.ts` | route path constants |
| `ui/router.tsx` | route → screen wiring; `RootLayout` mounts `ProjectsProvider` |
| `ui/AppShell.tsx` / `ui/WorkspaceShell.tsx` | the two shells (WorkspaceShell mounts `SkusProvider`) |
| `ui/data/projects.tsx` | **NEW** — `ProjectsProvider`/`useProjects` (live projects source) |
| `ui/data/skus.tsx` | **NEW** — `SkusProvider`/`useSkus` (per-project SKUs) |
| `ui/kit.tsx` | shared Button/Pill/SectionLabel/Card |
| `ui/screens/*.tsx` | the 25 hi-fi screens |
| `services/dbService.ts` | Supabase data layer (+ `loadSkuCounts`, `loadSkuSummaries`) |
| `App.tsx` (legacy, unmounted) | OLD monolith — reference for functionality to port |
| `types.ts`, `constants.ts`, `lib/supabase.ts` | existing logic to reuse |

## Notes / gotchas

- `node_modules` is **untracked** (was committed on macOS; we `.gitignore`-honored it).
  Run `npm install` on a fresh clone.
- The wireframe repo (`D:\User\OVARLY beta`) also has design briefs: `handoff-note.md`,
  `01`–`05` markdown, `look-feature-build-brief.md`, `add-skus-stored-redesign-brief.md`,
  `prepare-skus-modal-redesign-brief.md`.
- Modals (Create Project, Attach Look, Prepare SKU, Group SKU) render as
  `fixed inset-0` scrim + centered card over their shell.
