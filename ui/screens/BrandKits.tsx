import { useEffect, useMemo, useState } from 'react';
import { Button } from '../kit';
import * as db from '../../services/dbService';

/**
 * Brand Kits — REAL, persisted brand systems (name, colours, notes) stored as JSON docs
 * via the dbService document store. Create / edit / delete. Shell = AppShell.
 */

interface BrandKit {
  id: string;
  name: string;
  colors: string[];
  notes: string;
  createdAt: number;
}

const ico = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

const DEFAULT_COLORS = ['#156EF4', '#080808', '#ffffff'];
const newId = () => `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const listKits = () => db.listDocs<BrandKit>('brand-kits');

export default function BrandKits() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BrandKit | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = () => { setLoading(true); listKits().then(setKits).finally(() => setLoading(false)); };
  useEffect(() => { reload(); }, []);

  const create = () => setEditing({ id: newId(), name: '', colors: [...DEFAULT_COLORS], notes: '', createdAt: Date.now() });
  const remove = async (k: BrandKit) => {
    if (!window.confirm(`Delete brand kit “${k.name || 'Untitled'}”?`)) return;
    setKits((prev) => prev.filter((x) => x.id !== k.id));
    await db.deleteDoc('brand-kits', k.id).catch(() => reload());
  };
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const kit = { ...editing, name: editing.name.trim() || 'Untitled Kit' };
      await db.saveDoc('brand-kits', kit.id, kit as unknown as Record<string, any>);
      setEditing(null);
      reload();
    } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-wire-text">Brand Kits</h2>
          <p className="mt-1 text-sm text-wire-muted">Reusable brand systems — name, colours and notes. Saved to your workspace.</p>
        </div>
        <Button onClick={create}>+ New Brand Kit</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-lg bg-wire-bg-2" />)}</div>
      ) : kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-weak text-brand">{ico('M4 4h16v6H4zM4 14h7v6H4zM14 14h6v6h-6z', 22)}</span>
          <p className="text-base font-semibold text-wire-text">No brand kits yet</p>
          <p className="max-w-md text-sm text-wire-muted">Save a brand’s colours and notes once, then reuse them across projects and Looks.</p>
          <div className="mt-2"><Button onClick={create}>+ New Brand Kit</Button></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {kits.map((k) => (
            <div key={k.id} className="rounded-lg border border-wire-border bg-wire-surface p-4 shadow-card">
              <div className="flex h-16 overflow-hidden rounded-md border border-wire-border">
                {(k.colors.length ? k.colors : DEFAULT_COLORS).map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
              </div>
              <div className="mt-3 flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-wire-text">{k.name || 'Untitled Kit'}</p>
                  <p className="mt-0.5 text-xs text-wire-muted">{k.colors.length} colour{k.colors.length === 1 ? '' : 's'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditing(k)} aria-label="Edit" className="grid h-7 w-7 place-items-center rounded-md border border-wire-border text-wire-muted hover:text-brand">{ico('M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z', 14)}</button>
                  <button type="button" onClick={() => remove(k)} aria-label="Delete" className="grid h-7 w-7 place-items-center rounded-md border border-wire-border text-wire-muted hover:text-danger">{ico('M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14', 14)}</button>
                </div>
              </div>
              {k.notes ? <p className="mt-2 line-clamp-2 text-xs text-wire-muted">{k.notes}</p> : null}
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-xl border border-wire-border bg-wire-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-wire-border px-5 py-4">
              <h3 className="text-lg font-semibold text-wire-text">{kits.some((k) => k.id === editing.id) ? 'Edit brand kit' : 'New brand kit'}</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text">{ico('M18 6L6 18M6 6l12 12', 16)}</button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-wire-muted">Name</p>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Allen Solly" className="h-10 w-full rounded-md border border-wire-border bg-wire-bg px-3 text-sm text-wire-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-wire-muted">Colours</p>
                <div className="flex flex-wrap items-center gap-2">
                  {editing.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 rounded-md border border-wire-border bg-wire-bg p-1">
                      <input type="color" value={c} onChange={(e) => setEditing({ ...editing, colors: editing.colors.map((x, j) => j === i ? e.target.value : x) })} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
                      <button type="button" onClick={() => setEditing({ ...editing, colors: editing.colors.filter((_, j) => j !== i) })} className="pr-1 text-wire-faint hover:text-danger">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditing({ ...editing, colors: [...editing.colors, '#888888'] })} className="grid h-9 w-9 place-items-center rounded-md border border-dashed border-wire-border text-wire-muted hover:border-brand hover:text-brand">{ico('M12 5v14M5 12h14', 16)}</button>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-wire-muted">Notes</p>
                <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} placeholder="Typography, tone, usage guidelines…" className="w-full resize-none rounded-md border border-wire-border bg-wire-bg px-3 py-2 text-sm text-wire-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-wire-border px-5 py-4">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save kit'}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
