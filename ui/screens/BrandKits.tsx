import { Pill } from '../kit';

/**
 * BrandKits — hi-fi build of BrandKitsWireframe.
 * Coming-soon placeholder (sidebar "Brand Kits"). Full flow (logos, colours,
 * type, guidelines, reuse) is 1.1 scope. Shell is provided by AppShell.
 */

export default function BrandKits() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Brand Kits</h2>
        <p className="mt-1 text-sm text-wire-muted">Reusable brand systems — logos, colours, type and guidelines.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-wire-border bg-wire-surface px-6 py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-weak text-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 4h16v6H4zM4 14h7v6H4zM14 14h6v6h-6z" />
          </svg>
        </span>
        <Pill tone="brand">Coming in the next update</Pill>
        <p className="text-lg font-semibold text-wire-text">Brand Kits are on the way</p>
        <p className="max-w-md text-sm text-wire-muted">
          Save a brand's logos, colours, type and guidelines once and reuse them across projects and Looks. We'll design this together next.
        </p>
      </div>
    </div>
  );
}
