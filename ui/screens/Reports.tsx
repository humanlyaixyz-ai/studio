import { Pill } from '../kit';

/**
 * Reports — hi-fi build of ReportsWireframe.
 * Coming-soon placeholder (sidebar "Reports"). Full reporting/analytics is parked
 * for 1.1; the nav item is clickable and shows a coming-soon badge + message.
 * Shell is provided by AppShell.
 */

export default function Reports() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Reports</h2>
        <p className="mt-1 text-sm text-wire-muted">Team and production analytics.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-wire-border bg-wire-surface px-6 py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-weak text-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
          </svg>
        </span>
        <Pill tone="brand">Coming soon</Pill>
        <p className="text-lg font-semibold text-wire-text">Reports are on the way</p>
        <p className="max-w-md text-sm text-wire-muted">
          Production analytics — output volume, spend, turnaround and team activity — are arriving in a future update.
        </p>
      </div>
    </div>
  );
}
