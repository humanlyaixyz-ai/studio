import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

/**
 * Create New Project — hi-fi build of CreateProjectModalWireframe.
 * Modal: centered card over a dimmed scrim.
 * Origin: Dashboard (dimmed behind scrim). Cancel / ✕ / scrim → Dashboard.
 * Primary: Create project → Add SKU.
 * Lightweight container only: project name + optional brand.
 */

const RECENT_BRANDS = ['Nike', 'Zara', 'H&M'];

function Field({
  label,
  optional = false,
  required = false,
  placeholder,
  autoFocus = false,
}: {
  label: string;
  optional?: boolean;
  required?: boolean;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-wire-text">
        {label}
        {required ? <span className="text-brand">*</span> : null}
        {optional ? <span className="text-xs font-normal text-wire-muted">optional</span> : null}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="mt-1.5 h-10 w-full rounded-md border border-wire-border bg-wire-bg px-3 text-sm text-wire-text placeholder:text-wire-muted outline-none transition-colors focus:border-brand focus:bg-wire-surface focus:ring-2 focus:ring-brand-weak"
      />
    </div>
  );
}

function BrandPill({ children }: { children: string }) {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-full border border-wire-border bg-wire-surface px-3 py-1 text-xs font-medium text-wire-text transition-colors hover:border-brand hover:bg-brand-weak hover:text-brand"
    >
      {children}
    </button>
  );
}

export default function CreateProject() {
  const navigate = useNavigate();
  const close = () => navigate(ROUTES.dashboard);

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[480px] rounded-xl border border-wire-border bg-wire-surface p-6 shadow-pop"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-wire-text">Create new project</h3>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-wire-muted transition-colors hover:bg-wire-bg hover:text-wire-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-wire-muted">
          Start with a project name. You can add SKUs and service types later.
        </p>

        {/* Fields */}
        <div className="mt-6 space-y-4">
          <Field label="Project name" required placeholder="e.g. Summer Campaign" autoFocus />

          <div>
            <Field label="Brand name" optional placeholder="e.g. Nike" />
            <div className="mt-2">
              <p className="text-xs text-wire-muted">Recently used</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {RECENT_BRANDS.map((b) => (
                  <BrandPill key={b}>{b}</BrandPill>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={() => navigate(ROUTES.addSku)}>Create project</Button>
        </div>
      </div>
    </div>
  );
}
