import { Pill } from '../kit';

/**
 * Output — hi-fi build of OutputWireframe.
 * Placeholder workspace tab: generated assets collect here, pick a SKU and export.
 * Shell (tab bar + project menu) is provided by WorkspaceShell.
 */

export default function Output() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Output</h2>
        <p className="mt-1 text-sm text-wire-muted">Everything generated on the canvas lands here. Select a SKU and export.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-24 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-weak text-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 14l4-4 4 4 3-3 4 4" /><circle cx="8.5" cy="8.5" r="1.2" />
          </svg>
        </span>
        <Pill tone="brand">Coming in the next update</Pill>
        <p className="text-lg font-semibold text-wire-text">Output is on the way</p>
        <p className="max-w-md text-sm text-wire-muted">Generated assets will collect here so you can pick a SKU and export. We'll design this flow together next.</p>
      </div>
    </div>
  );
}
