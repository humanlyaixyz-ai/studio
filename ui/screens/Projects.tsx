import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useProjects, toVM } from '../data/projects';
import type { ProjectVM, ProjectStatus } from '../data/projects';

/**
 * Projects — hi-fi build of ProjectsWireframe.
 * The full project management list: status tabs (All / Active / Drafts / Archived),
 * search, sort, grid/list toggle. Cards open the Project Overview hub.
 * Shell (sidebar + header) is provided by AppShell.
 */

const sic = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const GRID = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';
const LIST = 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01';

type Status = ProjectStatus;
type Project = ProjectVM;

const TABS: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Drafts' },
  { key: 'archived', label: 'Archived' },
];

type SortKey = 'recent' | 'name' | 'skus';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'skus', label: 'Most SKUs' },
];

function StatusPill({ status }: { status: Status }) {
  const label = status === 'active' ? 'Active' : status === 'draft' ? 'Draft · setup incomplete' : 'Archived';
  const dot = status === 'active' ? 'bg-ok' : status === 'draft' ? 'bg-warn' : 'bg-wire-muted';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-wire-border bg-wire-surface/90 px-2 py-0.5 text-[11px] font-medium text-wire-muted backdrop-blur">
      <span className={['h-1.5 w-1.5 rounded-full', dot].join(' ')} />
      {label}
    </span>
  );
}

function ProjectCard({ p, onOpen, menuOpen, onMenu, onAction }: {
  p: Project; onOpen: () => void; menuOpen: boolean;
  onMenu: (e: MouseEvent) => void; onAction: (a: string) => void;
}) {
  const navigate = useNavigate();
  const archived = p.status === 'archived';
  const actions = archived ? ['Restore', 'Delete'] : ['Rename', 'Duplicate', 'Archive', 'Delete'];
  const go = (e: MouseEvent, to: string) => { e.stopPropagation(); navigate(to); };
  return (
    <div className="overflow-hidden rounded-lg border border-wire-border bg-wire-surface transition-all hover:border-wire-border-strong hover:shadow-card">
      <div onClick={onOpen} className="relative flex h-32 cursor-pointer items-center justify-center border-b border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
        <span className="text-xs text-wire-faint">Preview</span>
        <div className="absolute left-2 top-2"><StatusPill status={p.status} /></div>
        <div className="absolute right-2 top-2">
          <button type="button" onClick={onMenu} aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-full border border-wire-border bg-wire-surface/80 text-wire-muted backdrop-blur hover:text-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-8 z-10 w-40 rounded-md border border-wire-border bg-wire-surface py-1 shadow-pop" onClick={(e) => e.stopPropagation()}>
              {actions.map((a) => (
                <button key={a} type="button" onClick={() => onAction(a)} className={['block w-full px-3 py-2 text-left text-sm hover:bg-wire-bg', a === 'Delete' ? 'text-danger' : 'text-wire-text'].join(' ')}>{a}</button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="p-3">
        <div onClick={onOpen} className="cursor-pointer">
          <p className="text-sm font-semibold text-wire-text">{p.name}</p>
          <p className="mt-1 text-xs text-wire-muted">
            {p.skus} SKUs · {p.services} Service Type{p.services === 1 ? '' : 's'} · {p.edited}
          </p>
        </div>
        {!archived ? (
          <div className="mt-3 border-t border-wire-border pt-2.5">
            {p.setupDone ? (
              <button type="button" onClick={(e) => go(e, ROUTES.generationCanvas)} className="text-xs font-medium text-brand hover:underline">Start generation →</button>
            ) : (
              <button type="button" onClick={(e) => go(e, ROUTES.addSkuStored)} className="text-xs font-medium text-brand hover:underline">Continue setup →</button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProjectRow({ p, onOpen, onAction }: { p: Project; onOpen: () => void; onAction: (a: string) => void }) {
  const archived = p.status === 'archived';
  return (
    <div onClick={onOpen} className="flex cursor-pointer items-center gap-4 rounded-lg border border-wire-border bg-wire-surface px-4 py-3 transition-all hover:border-wire-border-strong hover:shadow-card">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gradient-to-br from-wire-bg-2 to-wire-bg text-[10px] text-wire-faint">IMG</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-wire-text">{p.name}</p>
        <p className="mt-0.5 text-xs text-wire-muted">{p.skus} SKUs · {p.services} Service Type{p.services === 1 ? '' : 's'} · {p.edited}</p>
      </div>
      <StatusPill status={p.status} />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAction(archived ? 'Restore' : 'Archive'); }}
        className="rounded-md border border-wire-border px-2.5 py-1.5 text-xs font-medium text-wire-muted hover:border-wire-border-strong hover:text-wire-text"
      >
        {archived ? 'Restore' : 'Archive'}
      </button>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const { projects: rows, skuCounts, archivedIds, loading, error, select, remove, rename, duplicate, setArchived } = useProjects();
  const [now] = useState(() => Date.now());
  const [tab, setTab] = useState<'all' | Status>('all');
  const [menu, setMenu] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const projects = useMemo<Project[]>(
    () => rows.map((p) => toVM(p, skuCounts[p.id] ?? 0, archivedIds.has(p.id), now)),
    [rows, skuCounts, archivedIds, now],
  );

  const count = (key: 'all' | Status) => (key === 'all' ? projects.length : projects.filter((p) => p.status === key).length);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = projects.filter((p) => tab === 'all' || p.status === tab);
    if (q) out = out.filter((p) => p.name.toLowerCase().includes(q));
    out = [...out].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'skus') return b.skus - a.skus;
      return a.ageHours - b.ageHours; // recent = smallest age first
    });
    return out;
  }, [projects, tab, query, sort]);

  const openProject = (p: Project) => { select(p.id); navigate(ROUTES.projectOverview); };

  const runAction = (p: Project, action: string) => {
    setMenu(null);
    if (action === 'Delete') {
      if (window.confirm(`Delete “${p.name}”? This can’t be undone.`)) remove(p.id);
    } else if (action === 'Archive') {
      setArchived(p.id, true);
    } else if (action === 'Restore') {
      setArchived(p.id, false);
    } else if (action === 'Rename') {
      const next = window.prompt('Rename project', p.name);
      if (next && next.trim()) rename(p.id, next.trim());
    } else if (action === 'Duplicate') {
      duplicate(p.id);
    }
  };

  const closeMenus = () => { setMenu(null); setSortOpen(false); };

  return (
    <div className="mx-auto max-w-6xl space-y-6" onClick={closeMenus}>
      {/* heading */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-wire-text">Projects</h2>
          <p className="mt-1 text-sm text-wire-muted">All your productions in one place.</p>
        </div>
        <Button onClick={() => navigate(ROUTES.createProject)}>+ New Project</Button>
      </div>

      {/* toolbar */}
      <div className="flex items-center justify-between">
        <label className="flex h-9 w-80 items-center gap-2 rounded-md border border-wire-border bg-wire-surface px-3 focus-within:border-brand">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted"
            placeholder="Search projects…"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-wire-faint hover:text-wire-text">✕</button>
          ) : null}
        </label>
        <div className="flex items-center gap-2">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="sm" onClick={() => { setSortOpen((v) => !v); setMenu(null); }}>
              Sort: {SORTS.find((s) => s.key === sort)!.label} ▾
            </Button>
            {sortOpen ? (
              <div className="absolute right-0 top-9 z-20 w-44 rounded-md border border-wire-border bg-wire-surface py-1 shadow-pop">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { setSort(s.key); setSortOpen(false); }}
                    className={['block w-full px-3 py-2 text-left text-sm hover:bg-wire-bg', sort === s.key ? 'font-semibold text-brand' : 'text-wire-text'].join(' ')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex overflow-hidden rounded-md border border-wire-border">
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              className={['border-r border-wire-border px-2 py-1.5', view === 'grid' ? 'bg-brand-weak text-brand' : 'text-wire-muted hover:bg-wire-bg'].join(' ')}
            >
              {sic(GRID)}
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="List view"
              aria-pressed={view === 'list'}
              className={['px-2 py-1.5', view === 'list' ? 'bg-brand-weak text-brand' : 'text-wire-muted hover:bg-wire-bg'].join(' ')}
            >
              {sic(LIST)}
            </button>
          </div>
        </div>
      </div>

      {/* status tabs */}
      <div className="flex items-center gap-1 border-b border-wire-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-wire-muted hover:text-wire-text',
            ].join(' ')}
          >
            {t.label} <span className={tab === t.key ? 'text-brand/70' : 'text-wire-faint'}>{count(t.key)}</span>
          </button>
        ))}
      </div>

      {/* grid / list / loading / error / empty */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-lg border border-wire-border bg-wire-bg-2" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-danger/40 bg-wire-surface px-6 py-16 text-center">
          <p className="text-base font-semibold text-wire-text">Couldn’t load projects</p>
          <p className="max-w-md text-sm text-wire-muted">{error}</p>
          <p className="text-xs text-wire-faint">Check your Supabase credentials in <code>.env.local</code>.</p>
        </div>
      ) : list.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-3 gap-4">
            {list.map((p) => (
              <ProjectCard
                key={p.id}
                p={p}
                onOpen={() => openProject(p)}
                menuOpen={menu === p.id}
                onMenu={(e) => { e.stopPropagation(); setMenu(menu === p.id ? null : p.id); setSortOpen(false); }}
                onAction={(a) => runAction(p, a)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((p) => (
              <ProjectRow key={p.id} p={p} onOpen={() => openProject(p)} onAction={(a) => runAction(p, a)} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-weak text-brand">{sic(GRID)}</div>
          <p className="text-base font-semibold text-wire-text">{query ? 'No matches' : 'Nothing here yet'}</p>
          <p className="max-w-md text-sm text-wire-muted">
            {query ? `No projects match “${query}”. Try a different search.` : 'No projects in this view. Start a new production to see it here.'}
          </p>
          <div className="mt-2">
            {query
              ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
              : <Button onClick={() => navigate(ROUTES.createProject)}>+ New Project</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
