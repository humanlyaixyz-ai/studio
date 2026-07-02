import { Pill } from '../kit';

/**
 * Review — hi-fi build of ReviewWireframe.
 * Placeholder workspace tab: a reviewer approves SKUs while others work the canvas.
 * Shell (tab bar + project menu) is provided by WorkspaceShell.
 */

export default function Review() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Review</h2>
        <p className="mt-1 text-sm text-wire-muted">A reviewer can approve SKUs here while others keep working on the canvas.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-24 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-weak text-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </span>
        <Pill tone="brand">Coming in the next update</Pill>
        <p className="text-lg font-semibold text-wire-text">Review is on the way</p>
        <p className="max-w-md text-sm text-wire-muted">Reviewers will approve SKUs or request changes here. We'll design this flow together next.</p>
      </div>
    </div>
  );
}
