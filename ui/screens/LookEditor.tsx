import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { listLooks, saveLook, getEditingLook, emptyLook, SERVICE_TYPES, MOODS, LIGHTINGS, FASHION_TYPES, type Look } from '../data/looks';

/**
 * Look Editor — REAL create/edit of a Look (persisted via dbService doc store).
 * If getEditingLook() has an id, loads that Look; otherwise starts a new one.
 * Save → persists → back to Library. Shell = AppShell.
 */

const STUDIO = [
  { name: 'Pure White', c: '#ffffff' }, { name: 'Off White', c: '#f1f0ec' }, { name: 'Studio Grey', c: '#c9c9cd' },
  { name: 'Warm Beige', c: '#e7e1d7' }, { name: 'Cool Grey', c: '#d2d5da' }, { name: 'Charcoal', c: '#3f3f46' },
];
const ENV_SUGGESTIONS = ['Sunlit street', 'Minimal studio corner', 'Golden-hour beach', 'Industrial loft', 'Lush garden', 'Marble tabletop'];

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} className={['rounded-md border px-3 py-1.5 text-xs font-medium', o === value ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border text-wire-muted hover:text-wire-text'].join(' ')}>{o}</button>
      ))}
    </div>
  );
}

function Label({ children }: { children: string }) {
  return <p className="mb-2 text-xs font-medium uppercase tracking-wide text-wire-muted">{children}</p>;
}

export default function LookEditor() {
  const navigate = useNavigate();
  const [look, setLook] = useState<Look>(() => emptyLook());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const editingId = getEditingLook();

  useEffect(() => {
    let cancelled = false;
    if (!editingId) { setLoading(false); return; }
    listLooks().then((all) => {
      if (cancelled) return;
      const found = all.find((l) => l.id === editingId);
      if (found) setLook({ ...emptyLook(), ...found });
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [editingId]);

  const set = <K extends keyof Look>(k: K, v: Look[K]) => setLook((prev) => ({ ...prev, [k]: v }));
  const addTag = () => { const t = tagDraft.trim(); if (t && !look.tags.includes(t)) set('tags', [...look.tags, t]); setTagDraft(''); };
  const removeTag = (t: string) => set('tags', look.tags.filter((x) => x !== t));

  const save = async () => {
    setSaving(true);
    try { await saveLook({ ...look, name: look.name.trim() || 'Untitled Look' }); navigate(ROUTES.lookLibrary); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="mx-auto max-w-5xl"><div className="h-96 animate-pulse rounded-lg bg-wire-bg-2" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-wire-muted">
        <button type="button" onClick={() => navigate(ROUTES.lookLibrary)} className="hover:text-brand">Looks</button>
        <span>/</span><span className="text-wire-text">{editingId ? 'Edit Look' : 'New Look'}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
            <Label>Look name</Label>
            <input value={look.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Clean Studio — Tops" className="h-10 w-full rounded-md border border-wire-border bg-wire-bg px-3 text-sm text-wire-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
            <div className="mt-4"><Label>Service type</Label><Chips options={SERVICE_TYPES} value={look.serviceType} onChange={(v) => set('serviceType', v)} /></div>
          </section>

          <section className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
            <Label>Background</Label>
            <div className="inline-flex rounded-md border border-wire-border bg-wire-bg p-0.5">
              {(['Studio', 'Environment'] as const).map((m) => (
                <button key={m} type="button" onClick={() => { set('background', m); set('backgroundValue', m === 'Studio' ? 'Pure White' : ENV_SUGGESTIONS[0]); }} className={['rounded px-4 py-1.5 text-sm font-medium transition-colors', look.background === m ? 'bg-brand text-white shadow-card' : 'text-wire-muted hover:text-wire-text'].join(' ')}>{m}</button>
              ))}
            </div>
            {look.background === 'Studio' ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {STUDIO.map((s) => (
                  <button key={s.name} type="button" onClick={() => set('backgroundValue', s.name)} className={['flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium', look.backgroundValue === s.name ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border text-wire-muted hover:text-wire-text'].join(' ')}>
                    <span className="h-4 w-4 rounded-sm border border-wire-border" style={{ backgroundColor: s.c }} />{s.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <input value={look.backgroundValue} onChange={(e) => set('backgroundValue', e.target.value)} placeholder="Describe the environment…" className="h-10 w-full rounded-md border border-wire-border bg-wire-bg px-3 text-sm text-wire-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {ENV_SUGGESTIONS.map((e) => <button key={e} type="button" onClick={() => set('backgroundValue', e)} className="rounded-full border border-wire-border px-2.5 py-1 text-[11px] text-wire-muted hover:border-brand hover:text-brand">{e}</button>)}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card space-y-4">
            <div><Label>Mood</Label><Chips options={MOODS} value={look.mood} onChange={(v) => set('mood', v)} /></div>
            <div><Label>Lighting</Label><Chips options={LIGHTINGS} value={look.lighting} onChange={(v) => set('lighting', v)} /></div>
            <div><Label>Fashion type</Label><Chips options={FASHION_TYPES} value={look.fashionType} onChange={(v) => set('fashionType', v)} /></div>
          </section>

          <section className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
            <Label>Tags</Label>
            <div className="flex flex-wrap items-center gap-2">
              {look.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full border border-wire-border bg-wire-bg px-2.5 py-1 text-xs text-wire-text">{t}<button type="button" onClick={() => removeTag(t)} className="text-wire-faint hover:text-danger">✕</button></span>
              ))}
              <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag + Enter" className="h-8 w-36 rounded-md border border-dashed border-wire-border bg-transparent px-2 text-xs text-wire-text focus:border-brand focus:outline-none" />
            </div>
          </section>
        </div>

        {/* summary rail */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-3 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
            <p className="text-sm font-semibold text-wire-text">Look summary</p>
            <div className="h-28 rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg" />
            <div className="space-y-1.5 text-xs text-wire-muted">
              <p><span className="text-wire-text">{look.name || 'Untitled Look'}</span></p>
              <p>Service: {look.serviceType}</p>
              <p>Background: {look.background} · {look.backgroundValue}</p>
              <p>Mood: {look.mood} · {look.lighting}</p>
              <p>Fashion: {look.fashionType}</p>
              <p>Tags: {look.tags.length ? look.tags.join(', ') : '—'}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => navigate(ROUTES.lookLibrary)}>Cancel</Button>
              <Button className="flex-1" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Look'}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
