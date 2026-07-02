import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

/**
 * ProjectWorkspace — hi-fi build of ProjectWorkspaceWireframe's content states.
 * The shell (tab bar + project menu) is provided by WorkspaceShell; here we port the
 * inner content the wireframe drove via its props.
 *   default  → the normal overview-in-workspace (activeSection "Overview", setup done)
 *   ServiceSetupLocked → screen-level locked state (locked prop → requires Add SKU)
 */

/** The project's home content, shown inside the workspace shell. */
export default function ProjectWorkspace() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* actions (no footer on Overview) */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate(ROUTES.addSkuStored)}>Edit setup</Button>
        <Button onClick={() => navigate(ROUTES.generationCanvas)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
          </svg>
          Open Generation Canvas
        </Button>
      </div>

      {/* project header */}
      <div className="flex items-center gap-4 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <div className="h-20 w-28 shrink-0 rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-wire-text">Nike Summer Campaign</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-ok-weak px-2 py-0.5 text-[11px] font-medium text-ok">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Active
            </span>
          </div>
          <p className="mt-1 text-sm text-wire-muted">24 SKUs · 3 Service Types · Last edited 2 hours ago</p>
        </div>
      </div>

      {/* coming-soon hub body */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-weak text-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 5h16v14H4zM4 9h16M9 5v14" />
          </svg>
        </span>
        <span className="inline-flex items-center rounded-full border border-brand-weak-2 bg-brand-weak px-3 py-1 text-xs font-medium text-brand">Coming in the next update</span>
        <p className="text-lg font-semibold text-wire-text">The project hub is on the way</p>
        <p className="max-w-lg text-sm text-wire-muted">
          Status &amp; progress, SKUs, Service Types with their attached Looks, and an outputs gallery will live here. For now, use the actions above to continue setup or open the canvas.
        </p>
      </div>
    </div>
  );
}

/**
 * ServiceSetupLocked — the workspace shell's screen-level locked state.
 * The project menu still toggles freely; this section just isn't ready yet because its
 * prerequisite (Add SKU) is incomplete. Mirrors the wireframe's `locked` prop.
 */
export function ServiceSetupLocked() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-xl border border-wire-border bg-wire-surface text-wire-muted">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          <path d="M12 15v2" />
        </svg>
      </div>
      <p className="text-base font-semibold text-wire-text">Service Setup is locked</p>
      <p className="max-w-md text-sm text-wire-muted">Finish Add SKU first to unlock this section.</p>
      <Button className="mt-1" onClick={() => navigate(ROUTES.addSkuStored)}>Go to Add SKU</Button>
    </div>
  );
}
