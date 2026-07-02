import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

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

type Status = 'active' | 'draft' | 'archived';
type Project = { name: string; status: Status; skus: number; services: number; edited: string; setupDone: boolean };

const PROJECTS: Project[] = [
  { name: 'Nike Summer Campaign', status: 'active', skus: 24, services: 3, edited: '2 hours ago', setupDone: true },
  { name: 'Zara Editorial Shoot', status: 'active', skus: 12, services: 2, edited: '1 day ago', setupDone: true },
  { name: 'Lifestyle Collection', status: 'active', skus: 40, services: 4, edited: '2 days ago', setupDone: true },
  { name: 'E-Commerce — Tops', status: 'active', skus: 18, services: 1, edited: '3 days ago', setupDone: true },
  { name: 'Jewelry Campaign', status: 'active', skus: 30, services: 2, edited: '4 days ago', setupDone: true },
  { name: 'Streetwear Lookbook', status: 'active', skus: 22, services: 3, edited: '5 days ago', setupDone: true },
  { name: 'Untitled Project', status: 'draft', skus: 0, services: 0, edited: '1 day ago', setupDone: false },
  { name: 'Spring Drop — Draft', status: 'draft', skus: 8, services: 0, edited: '3 days ago', setupDone: false },
  { name: 'Winter 2025 Lookbook', status: 'archived', skus: 50, services: 5, edited: '2 months ago', setupDone: true },
  { name: 'SS24 Marketplace', status: 'archived', skus: 36, services: 3, edited: '4 months ago', setupDone: true },
];

const TABS: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Drafts' },
  { key: 'archived', label: 'Archived' },
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

function ProjectCard({ p, onOpen, menuOpen, onMenu }: { p: Project; onOpen: () => void; menuOpen: boolean; onMenu: (e: MouseEvent) => void }) {
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
            <div className="absolute right-0 top-8 z-10 w-40 rounded-md border border-wire-border bg-wire-surface py-1 shadow-pop">
              {actions.map((a) => (
                <button key={a} type="button" className={['block w-full px-3 py-2 text-left text-sm hover:bg-wire-bg', a === 'Delete' ? 'text-danger' : 'text-wire-text'].join(' ')}>{a}</button>
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

export default function Projects() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | Status>('all');
  const [menu, setMenu] = useState<string | null>(null);

  const list = tab === 'all' ? PROJECTS : PROJECTS.filter((p) => p.status === tab);
  const count = (key: 'all' | Status) => (key === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.status === key).length);

  return (
    <div className="mx-auto max-w-6xl space-y-6" onClick={() => setMenu(null)}>
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
          <input className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted" placeholder="Search projects…" />
        </label>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">Sort: Recent ▾</Button>
          <div className="flex overflow-hidden rounded-md border border-wire-border">
            <span className="border-r border-wire-border bg-brand-weak px-2 py-1.5 text-brand">{sic(GRID)}</span>
            <span className="px-2 py-1.5 text-wire-muted">{sic(LIST)}</span>
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

      {/* grid or empty */}
      {list.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {list.map((p) => (
            <ProjectCard
              key={p.name}
              p={p}
              onOpen={() => navigate(ROUTES.projectOverview)}
              menuOpen={menu === p.name}
              onMenu={(e) => { e.stopPropagation(); setMenu(menu === p.name ? null : p.name); }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-weak text-brand">{sic(GRID)}</div>
          <p className="text-base font-semibold text-wire-text">Nothing here yet</p>
          <p className="max-w-md text-sm text-wire-muted">No projects in this view. Start a new production to see it here.</p>
          <div className="mt-2"><Button onClick={() => navigate(ROUTES.createProject)}>+ New Project</Button></div>
        </div>
      )}
    </div>
  );
}
