import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useProjects, toVM } from '../data/projects';
import { useSkus } from '../data/skus';
import * as db from '../../services/dbService';
import type { GenerationBatch } from '../../types';

/**
 * ProjectOverview — the project's home tab. Header + a REAL hub body: a setup checklist,
 * a SKU preview (useSkus), and an outputs preview (db.loadProjectBatches). Each block links
 * into the relevant workspace tab. Shell (tab bar + project menu) is from WorkspaceShell.
 */

const ico = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

function StepRow({ done, label, hint, action, onAction }: { done: boolean; label: string; hint: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={['grid h-6 w-6 shrink-0 place-items-center rounded-full', done ? 'bg-ok-weak text-ok' : 'border border-wire-border bg-wire-surface text-wire-faint'].join(' ')}>
        {done ? ico('M20 6 9 17l-5-5', 14) : <span className="h-1.5 w-1.5 rounded-full bg-wire-faint" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={['text-sm font-medium', done ? 'text-wire-text' : 'text-wire-text'].join(' ')}>{label}</p>
        <p className="text-xs text-wire-muted">{hint}</p>
      </div>
      {action && onAction ? (
        <button type="button" onClick={onAction} className="shrink-0 text-xs font-medium text-brand hover:underline">{action}</button>
      ) : null}
    </div>
  );
}

export default function ProjectOverview() {
  const navigate = useNavigate();
  const { projects, skuCounts, archivedIds, selectedId, loading } = useProjects();
  const { skus } = useSkus();
  const [now] = useState(() => Date.now());
  const [batches, setBatches] = useState<GenerationBatch[]>([]);

  const project = useMemo(() => {
    const row = projects.find((p) => p.id === selectedId);
    return row ? toVM(row, skuCounts[row.id] ?? 0, archivedIds.has(row.id), now) : null;
  }, [projects, selectedId, skuCounts, archivedIds, now]);

  useEffect(() => {
    if (!selectedId) { setBatches([]); return; }
    let cancelled = false;
    db.loadProjectBatches(selectedId).then((rows) => { if (!cancelled) setBatches(rows); }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedId]);

  const outputs = useMemo(() => batches.flatMap((b) => b.images).filter((i) => i.status === 'success' && i.url), [batches]);
  const skuThumbs = skus.filter((s) => s.thumbUrl).slice(0, 6);

  if (!project && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
        <p className="text-lg font-semibold text-wire-text">No project selected</p>
        <p className="max-w-md text-sm text-wire-muted">Pick a project to see its overview.</p>
        <div className="mt-2"><Button onClick={() => navigate(ROUTES.projects)}>Go to Projects</Button></div>
      </div>
    );
  }

  const setupDone = project?.setupDone ?? false;
  const statusActive = project?.status !== 'draft';
  const hasSkus = skus.length > 0;
  const hasShots = (project?.services ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* actions */}
      <div className="flex items-center justify-end gap-2">
        {setupDone ? (
          <>
            <Button variant="secondary" onClick={() => navigate(ROUTES.addSkuStored)}>Edit setup</Button>
            <Button onClick={() => navigate(ROUTES.generationCanvas)}>
              {ico('M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4z', 16)}
              Open Generation Canvas
            </Button>
          </>
        ) : (
          <Button onClick={() => navigate(ROUTES.addSkuStored)}>Continue setup</Button>
        )}
      </div>

      {/* header */}
      <div className="flex items-center gap-4 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
          {skuThumbs[0]?.thumbUrl ? <img src={skuThumbs[0].thumbUrl} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-wire-text">{project?.name ?? 'Loading…'}</h2>
            {project ? (
              <span className={['inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 text-[11px] font-medium', statusActive ? 'bg-ok-weak text-ok' : 'bg-warn-weak text-warn'].join(' ')}>
                <span className={['h-1.5 w-1.5 rounded-full', statusActive ? 'bg-ok' : 'bg-warn'].join(' ')} /> {statusActive ? 'Active' : 'Draft'}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-wire-muted">
            {project
              ? `${project.skus} SKU${project.skus === 1 ? '' : 's'} · ${project.services} shot${project.services === 1 ? '' : 's'} · ${outputs.length} output${outputs.length === 1 ? '' : 's'} · Last edited ${project.edited}`
              : 'Loading project…'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* setup checklist */}
        <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card lg:col-span-1">
          <p className="text-sm font-semibold text-wire-text">Setup progress</p>
          <div className="mt-2 divide-y divide-wire-border">
            <StepRow done label="Project created" hint="Category and shoot model set." />
            <StepRow done={hasSkus} label="Add SKUs" hint={hasSkus ? `${skus.length} SKU${skus.length === 1 ? '' : 's'} uploaded.` : 'Upload product images.'} action={hasSkus ? 'View' : 'Add'} onAction={() => navigate(ROUTES.addSkuStored)} />
            <StepRow done={hasShots} label="Service setup" hint={hasShots ? `${project?.services} shot${project?.services === 1 ? '' : 's'} configured.` : 'Choose shots to generate.'} action="Edit" onAction={() => navigate(ROUTES.serviceSetup)} />
            <StepRow done={outputs.length > 0} label="Generate" hint={outputs.length > 0 ? `${outputs.length} image${outputs.length === 1 ? '' : 's'} generated.` : 'Run the canvas to create images.'} action="Open" onAction={() => navigate(ROUTES.generationCanvas)} />
          </div>
        </div>

        {/* SKUs preview */}
        <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-wire-text">SKUs</p>
            <button type="button" onClick={() => navigate(ROUTES.addSkuStored)} className="text-xs font-medium text-brand hover:underline">Manage SKUs</button>
          </div>
          {skus.length === 0 ? (
            <div className="rounded-md border border-dashed border-wire-border bg-wire-bg px-4 py-8 text-center text-sm text-wire-muted">No SKUs yet.</div>
          ) : (
            <div className="grid grid-cols-6 gap-3">
              {skus.slice(0, 6).map((s) => (
                <div key={s.id} className="text-center">
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-md border border-wire-border bg-wire-bg-2">
                    {s.thumbUrl ? <img src={s.thumbUrl} alt={s.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-wire-faint">{ico('M3 4h18v16H3zM3 15l4-4 4 4', 18)}</span>}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-wire-muted" title={s.name}>{s.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* outputs preview */}
      <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-wire-text">Recent outputs</p>
          <button type="button" onClick={() => navigate(ROUTES.output)} className="text-xs font-medium text-brand hover:underline">Open Output</button>
        </div>
        {outputs.length === 0 ? (
          <div className="rounded-md border border-dashed border-wire-border bg-wire-bg px-4 py-10 text-center text-sm text-wire-muted">
            Nothing generated yet — open the Generation Canvas to create images.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {outputs.slice(0, 12).map((img) => (
              <div key={img.id} className="aspect-[3/4] overflow-hidden rounded-md border border-wire-border bg-wire-bg-2">
                <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
