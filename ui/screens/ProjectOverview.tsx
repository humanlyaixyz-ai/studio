import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useProjects, toVM } from '../data/projects';

/**
 * ProjectOverview — hi-fi build of ProjectOverviewWireframe.
 * The project's home tab inside the workspace shell (Project menu · Overview).
 * Header reflects the real selected project (from useProjects). Actions live top-right
 * (no footer). The hub body itself is next-update scope; uses the coming-soon pattern.
 * Shell (tab bar + project menu) is provided by WorkspaceShell.
 */

export default function ProjectOverview() {
  const navigate = useNavigate();
  const { projects, skuCounts, archivedIds, selectedId, loading } = useProjects();
  const [now] = useState(() => Date.now());

  const project = useMemo(() => {
    const row = projects.find((p) => p.id === selectedId);
    return row ? toVM(row, skuCounts[row.id] ?? 0, archivedIds.has(row.id), now) : null;
  }, [projects, selectedId, skuCounts, archivedIds, now]);

  // No project in context (e.g. deep link / storage cleared) and nothing loading.
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

  return (
    <div className="space-y-6">
      {/* actions (no footer on Overview) */}
      <div className="flex items-center justify-end gap-2">
        {setupDone ? (
          <>
            <Button variant="secondary" onClick={() => navigate(ROUTES.addSkuStored)}>Edit setup</Button>
            <Button onClick={() => navigate(ROUTES.generationCanvas)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
              </svg>
              Open Generation Canvas
            </Button>
          </>
        ) : (
          <Button onClick={() => navigate(ROUTES.addSkuStored)}>Continue setup</Button>
        )}
      </div>

      {/* project header */}
      <div className="flex items-center gap-4 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <div className="h-20 w-28 shrink-0 rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg" aria-hidden />
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
              ? `${project.skus} SKU${project.skus === 1 ? '' : 's'} · ${project.services} Service Type${project.services === 1 ? '' : 's'} · Last edited ${project.edited}`
              : 'Loading project…'}
          </p>
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
