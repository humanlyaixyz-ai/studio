import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useProjects } from '../data/projects';
import { ModelType, ProductCategory } from '../../types';
import type { Project } from '../../types';

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
  value,
  onChange,
}: {
  label: string;
  optional?: boolean;
  required?: boolean;
  placeholder: string;
  autoFocus?: boolean;
  value: string;
  onChange: (v: string) => void;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-10 w-full rounded-md border border-wire-border bg-wire-bg px-3 text-sm text-wire-text placeholder:text-wire-muted outline-none transition-colors focus:border-brand focus:bg-wire-surface focus:ring-2 focus:ring-brand-weak"
      />
    </div>
  );
}

function BrandPill({ children, active, onClick }: { children: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={['rounded-full border px-3 py-1 text-xs font-medium transition-colors', active ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-brand hover:bg-brand-weak hover:text-brand'].join(' ')}
    >
      {children}
    </button>
  );
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { create } = useProjects();
  const close = () => navigate(ROUTES.dashboard);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const now = Date.now();
    const project: Project = {
      id: `${now}`,
      name: name.trim(),
      createdAt: now,
      category: ProductCategory.TOP,
      model: ModelType.ECOM_SHOOT,
      brandName: brand.trim(),
      shots: [], // no service types yet → project starts as a draft, ready for setup
    };
    try {
      await create(project);
      navigate(ROUTES.projectOverview); // open the new project (setup flow lands here)
    } catch {
      setSaving(false);
    }
  };

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
          <Field label="Project name" required placeholder="e.g. Summer Campaign" autoFocus value={name} onChange={setName} />

          <div>
            <Field label="Brand name" optional placeholder="e.g. Nike" value={brand} onChange={setBrand} />
            <div className="mt-2">
              <p className="text-xs text-wire-muted">Recently used</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {RECENT_BRANDS.map((b) => (
                  <BrandPill key={b} active={brand === b} onClick={() => setBrand(brand === b ? '' : b)}>{b}</BrandPill>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || saving} title={name.trim() ? '' : 'Enter a project name'}>{saving ? 'Creating…' : 'Create project'}</Button>
        </div>
      </div>
    </div>
  );
}
