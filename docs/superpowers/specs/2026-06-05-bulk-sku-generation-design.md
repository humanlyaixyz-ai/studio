# Bulk SKU Generation — Design Spec
Date: 2026-06-05

## Context

The click-app workspace allows users to create projects with multiple product SKUs (e.g. colour/size variants of a garment). Each SKU owns the product-specific image slots for its category (e.g. `bottomFront`/`bottomBack` for Bottom), while supporting assets (character face, background) are shared at the project level.

The current bulk generation system is unusable: it lives in a cramped 52vh panel, the progress state is invisible, results are 140px horizontal thumbnail strips, and the flow is hard to discover. This spec replaces it entirely.

---

## Scope

- Redesign the SKU bottom panel (single-SKU mode)
- Add a bulk confirmation overlay (2+ SKUs selected)
- Redesign the bulk generation canvas (live fill-in grid)
- Redesign the bulk results state (same layout, enriched actions)
- Remove: `bulkRunBatchIds` in-memory state, "Bulk Results" nav button, horizontal scroll strips

Out of scope: changes to single-SKU generation, the Inputs/Settings/Camera/Shots tabs, or the dashboard.

---

## 1. SKU Bottom Panel (single-SKU mode)

**Trigger:** User opens the SKUs tab in the bottom pill bar.

**Layout changes over current:**
- SKU cards: 110px wide (up from 90px), product thumbnail fills the card
- Checkbox: top-left corner of each card, always visible (not hidden behind hover)
- "Select all / Deselect all": always rendered at the top, not conditionally shown
- Panel scroll: vertical, not cramped — the panel uses the full `maxHeight: 52vh` allocation cleanly

**Single-SKU selection behaviour (unchanged):**
- Clicking a card body (not the checkbox) selects it as the active SKU
- Active SKU name shown in gold in the pill bar status strip
- Product slots for that SKU are loaded into `uploadedFiles` (current behaviour, kept)
- Single generate button in pill bar generates for the active SKU only

**Bulk selection behaviour:**
- Checking 2+ SKU checkboxes causes the pill bar's generate button to be replaced by a gold **"Run Batch (N)"** button
- This button is always visible in the pill bar when ≥2 SKUs are checked — not hidden inside the panel
- Clicking "Run Batch (N)" opens the bulk confirmation overlay

---

## 2. Bulk Confirmation Overlay

**Trigger:** User clicks "Run Batch (N)" with ≥2 SKUs checked.

**Behaviour:** A full-canvas overlay slides up over the workspace main canvas (z-index above canvas, below top bar). The bottom pill bar remains accessible so the user can open the SKU panel and deselect SKUs.

**Layout — two columns:**

**Left column — SKU queue:**
- Ordered list of all selected SKUs
- Each row: product thumbnail (40×40px) + SKU name + optional SKU code + an × deselect button
- Removing a SKU from this list also unchecks it in the panel

**Right column — Shared inputs:**
- Label: "Used for all SKUs"
- Shows each project-level supporting asset as a small thumbnail with its slot label (Character Face, Background, etc.)
- If a required supporting asset is missing: red warning row "Character Face missing — add in Inputs before running"
- No blocking gate — user can still hit Generate, the warning is advisory

**Footer:**
- Shot count summary: "6 shots × 3 SKUs = 18 images"
- Large **"Generate All"** button (gold, full-width)
- Small "Cancel" link (closes overlay, returns to canvas)

**On "Generate All":**
- Overlay closes immediately
- Canvas switches to live bulk run mode
- Generation starts for the first SKU

---

## 3. Canvas — Live Bulk Run

**Trigger:** Immediately on "Generate All".

**Canvas replaces** the normal image grid with the bulk run layout. The pill bar and top bar remain usable.

**Top bar additions during run:**
- Centre: "Bulk Run — 2/5 SKUs · 11/30 shots" (live-updating)
- Right side: "✕ Cancel" link — cancels after the current SKU finishes (does not mid-SKU abort)

**SKU card structure (one per selected SKU, rendered immediately):**

```
Header row:
  [40px product thumb] [SKU name]  [status badge]  [X/N shots]

Shot strip (horizontal, non-scrolling where possible):
  [shot 1] [shot 2] [shot 3] [shot 4] [shot 5] [shot 6]
```

**Status badges:**
- `● Queued` — grey, not yet started
- `● Generating` — gold, animated pulse
- `✓ Done` — green
- `✗ Failed (N)` — red, N = number of failed shots

**Shot cell states:**
- Queued: empty placeholder (dim border, no content)
- Generating: spinner centred in cell
- Success: image fills cell; hover shows download + refine + color-grade icons
- Failed: red background, "Retry" button centred in cell — retries that single shot inline without restarting the batch

**Shot cell sizing:**
- Cells use `aspect-ratio: 3/4`
- Width: `calc((panel-width - gaps) / shot-count)`, capped at 180px, minimum 100px
- If shot count × min-width exceeds panel width, cells wrap to two rows

**Ordering:** SKUs render in the order they appear in the SKU panel (creation order). The currently-generating SKU scrolls into view automatically.

---

## 4. Results State

**Trigger:** All SKUs complete (all shots done or failed).

**Canvas stays exactly as-is** — no transition, no layout change. Additions only:

**Top bar changes:**
- Replaces "Bulk Run — X/Y" with "Bulk complete — 28/30 shots"
- Adds "↓ Download all SKUs" button (right side) — zips all successful images across all SKUs, named `{SKUName}_Shot_{N}.jpg`

**Per-card additions:**
- "↓ Download all" button appears in the card header (downloads that SKU's successful shots as a zip)
- Status badge updates to final state

**Image interactions (same as single generation):**
- Click image → selects it for editing in the edit bar at the bottom
- Hover → download, refine, color-grade buttons
- Failed cell → inline Retry (re-runs that shot, updates the cell in place)

**Persistence:**
- Each SKU's batch is saved to Supabase (`generation_batches` with `sku_id`) as it completes — not at the end
- On reload, batches are recoverable via the History dropdown (each batch labelled with SKU name)
- The live bulk run canvas view is session-only — reloading returns to the normal canvas with History available

---

## 5. State Changes in App.tsx

### Removed
- `bulkRunBatchIds: string[]` — replaced by deriving from `generationHistory` filtered by a `bulkRunId`
- `viewingBulkRun: boolean` — replaced by `bulkRunId !== null`
- "Bulk Results" button in top bar navigation
- Horizontal scroll strip rendering in canvas

### Added
- `bulkRunId: string | null` — set when a bulk run starts, cleared on new single generation or back-to-dashboard. All batches in the run share this ID.
- `showBulkOverlay: boolean` — controls the confirmation overlay visibility
- `bulkRunId` stored on each `GenerationBatch` (frontend-only field, not persisted to DB)

### Derived
- `bulkBatches`: `generationHistory.filter(b => b.bulkRunId === bulkRunId)`
- Whether we're in bulk results view: `bulkRunId !== null`

---

## 6. Component Structure

### New: `BulkConfirmOverlay`
Props: `skus`, `supportingAssets`, `shotCount`, `onGenerate`, `onCancel`, `onRemoveSKU`
Renders the two-column confirmation overlay.

### New: `BulkResultsCanvas`
Props: `batches`, `onRetryShot`, `onDownloadAll`, `onDownloadSKU`, `onSelectImage`
Renders the SKU card grid with live-filling shot cells.

### Modified: `SKUAddForm` — no changes to functionality
### Modified: `App.tsx` — state, handlers, render logic as above

---

## 7. Data Model Addition

Add `bulkRunId?: string` to the `GenerationBatch` interface in `types.ts`. This is a frontend-only field — not persisted to the DB (the `sku_id` column already ties batches to SKUs for history recovery).

---

## Self-Review

- No TBDs or placeholders remain
- Overlay ↔ canvas transition is fully described
- Shot cell sizing handles edge cases (many shots, narrow panel)
- Retry behaviour is specified (single shot, inline, no restart)
- Persistence/reload behaviour is explicit
- Removed state is listed to avoid leaving dead code
- Scope boundary is clear (single-SKU gen unchanged)
