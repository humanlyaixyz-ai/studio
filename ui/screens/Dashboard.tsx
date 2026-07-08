import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill, SectionLabel, Card } from '../kit';
import { useProjects, toVM } from '../data/projects';
import type { ProjectVM } from '../data/projects';

/**
 * Dashboard — hi-fi build of DashboardV2Wireframe.
 * Reading order: Welcome → Quick Actions → Continue Working → Recent → Drafts → Archived.
 * Shell (sidebar + header) is provided by AppShell.
 */

const sic = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const GRID = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';
const LIST = 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01';
const STAR = 'M12 3l2.6 5.6L20.5 9l-4.2 4 1 6L12 20l-5.3 -1 1-6L3.5 9l5.9-.4z';

const QUICK_ACTIONS = [
  { title: 'Create Project', hint: 'Start a new production', to: ROUTES.createProject, icon: sic('M12 5v14M5 12h14') },
  { title: 'Create Look', hint: 'A reusable look + background preset', to: ROUTES.lookLibrary, icon: sic(STAR) },
  { title: 'Upload Assets', hint: 'Add to Assets Library', to: ROUTES.assetsLibrary, icon: sic('M12 16V4M7 9l5-5 5 5M4 20h16') },
  { title: 'Import Brand Kit', hint: 'Reuse a brand system', to: ROUTES.brandKits, icon: sic('M4 4h16v6H4zM4 14h7v6H4zM14 14h6v6h-6z') },
];

type SortKey = 'recent' | 'name';

const recentMeta = (p: ProjectVM) => `${p.skus} SKU${p.skus === 1 ? '' : 's'} · ${p.services} Service Type${p.services === 1 ? '' : 's'} · Edited ${p.edited}`;
const draftMeta = (p: ProjectVM) => `${p.services === 0 ? 'No service types' : 'Setup incomplete'} · ${p.edited}`;

function StarButton({ on, onToggle }: { on: boolean; onToggle: (e: MouseEvent) => void }) {
  return (
    <button
      onClick={onToggle}
      className={['absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-wire-border bg-wire-surface/80 backdrop-blur hover:text-brand', on ? 'text-brand' : 'text-wire-muted'].join(' ')}
      aria-label={on ? 'Unfavorite' : 'Favorite'}
      aria-pressed={on}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={STAR} /></svg>
    </button>
  );
}

function ProjectCard({ name, meta, fav, onFav, onClick }: { name: string; meta: string; fav: boolean; onFav: (e: MouseEvent) => void; onClick?: () => void }) {
  return (
    <Card hover className="cursor-pointer overflow-hidden">
      <div onClick={onClick}>
        <div className="relative flex h-32 items-center justify-center border-b border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
          <span className="text-xs text-wire-faint">Preview</span>
          <StarButton on={fav} onToggle={onFav} />
        </div>
        <div className="flex items-center justify-between p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-wire-text">{name}</p>
            <p className="text-xs text-wire-muted">{meta}</p>
          </div>
          <div className="h-6 w-6 rounded-full bg-wire-bg-2" aria-hidden />
        </div>
      </div>
    </Card>
  );
}

function ProjectRow({ name, meta, fav, onFav, onClick }: { name: string; meta: string; fav: boolean; onFav: (e: MouseEvent) => void; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex cursor-pointer items-center gap-4 rounded-lg border border-wire-border bg-wire-surface px-4 py-3 transition-all hover:border-wire-border-strong hover:shadow-card">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gradient-to-br from-wire-bg-2 to-wire-bg text-[10px] text-wire-faint">IMG</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-wire-text">{name}</p>
        <p className="mt-0.5 text-xs text-wire-muted">{meta}</p>
      </div>
      <button onClick={onFav} aria-label={fav ? 'Unfavorite' : 'Favorite'} aria-pressed={fav} className={['grid h-8 w-8 place-items-center rounded-md border border-wire-border hover:text-brand', fav ? 'text-brand' : 'text-wire-muted'].join(' ')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={STAR} /></svg>
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects: rows, skuCounts, archivedIds, loading, select } = useProjects();
  const [now] = useState(() => Date.now());
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const all = useMemo<ProjectVM[]>(
    () => rows.map((p) => toVM(p, skuCounts[p.id] ?? 0, archivedIds.has(p.id), now)),
    [rows, skuCounts, archivedIds, now],
  );

  const active = useMemo(() => all.filter((p) => p.status !== 'archived'), [all]);
  const drafts = useMemo(() => all.filter((p) => p.status === 'draft').slice(0, 3), [all]);
  const archivedCount = useMemo(() => all.filter((p) => p.status === 'archived').length, [all]);
  const continueProject = active[0];

  const toggleFav = (id: string) => setFavs((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const openProject = (id: string) => { select(id); navigate(ROUTES.projectOverview); };

  const recent = useMemo(() => {
    let out = favOnly ? active.filter((r) => favs.has(r.id)) : active.slice();
    out = [...out].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : a.ageHours - b.ageHours));
    return out.slice(0, 6);
  }, [active, favOnly, favs, sort]);

  return (
    <div className="space-y-6" onClick={() => setSortOpen(false)}>
      {/* 1 — Welcome */}
      <div>
        <p className="text-sm text-wire-muted">Good morning · Fri, 12 Jun</p>
        <h2 className="text-2xl font-semibold text-wire-text">Welcome back</h2>
      </div>

      {/* 2 — Quick Actions */}
      <section>
        <SectionLabel>Quick actions</SectionLabel>
        <div className="grid grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.title}
              onClick={() => navigate(a.to)}
              className="group flex items-center gap-3 rounded-lg border border-wire-border bg-wire-surface p-4 text-left transition-all hover:border-brand hover:shadow-card"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand-weak text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                {a.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold text-wire-text">{a.title}</span>
                <span className="block text-xs text-wire-muted">{a.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3 — Continue Working */}
      {continueProject ? (
        <section>
          <SectionLabel>Continue working</SectionLabel>
          <Card className="flex items-center gap-4 p-4">
            <div className="h-24 w-32 shrink-0 rounded-md bg-gradient-to-br from-wire-bg-2 to-wire-bg" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-wire-text">{continueProject.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Pill>{continueProject.skus} SKU{continueProject.skus === 1 ? '' : 's'}</Pill>
                <Pill>{continueProject.services} Service Type{continueProject.services === 1 ? '' : 's'}</Pill>
                <Pill>Last edited {continueProject.edited}</Pill>
              </div>
              <p className="mt-3 text-xs text-wire-muted">
                {continueProject.setupDone ? 'Setup complete · ready to generate' : 'Setup in progress · next: Service Setup'}
              </p>
            </div>
            <Button onClick={() => openProject(continueProject.id)}>Resume</Button>
          </Card>
        </section>
      ) : null}

      {/* 4 — Recent Projects */}
      <section>
        <SectionLabel
          action={
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button variant={favOnly ? 'primary' : 'secondary'} size="sm" onClick={() => setFavOnly((v) => !v)}>
                {favOnly ? '★ Favorites' : 'Filter'}
              </Button>
              <div className="relative">
                <Button variant="secondary" size="sm" onClick={() => setSortOpen((v) => !v)}>Sort: {sort === 'name' ? 'Name' : 'Recent'} ▾</Button>
                {sortOpen ? (
                  <div className="absolute right-0 top-9 z-20 w-40 rounded-md border border-wire-border bg-wire-surface py-1 shadow-pop">
                    {(['recent', 'name'] as SortKey[]).map((s) => (
                      <button key={s} type="button" onClick={() => { setSort(s); setSortOpen(false); }} className={['block w-full px-3 py-2 text-left text-sm hover:bg-wire-bg', sort === s ? 'font-semibold text-brand' : 'text-wire-text'].join(' ')}>{s === 'name' ? 'Name (A–Z)' : 'Recent'}</button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex overflow-hidden rounded-md border border-wire-border">
                <button type="button" onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'} className={['border-r border-wire-border px-2 py-1.5', view === 'grid' ? 'bg-brand-weak text-brand' : 'text-wire-muted hover:bg-wire-bg'].join(' ')}>{sic(GRID)}</button>
                <button type="button" onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'} className={['px-2 py-1.5', view === 'list' ? 'bg-brand-weak text-brand' : 'text-wire-muted hover:bg-wire-bg'].join(' ')}>{sic(LIST)}</button>
              </div>
              <Button size="sm" onClick={() => navigate(ROUTES.createProject)}>+ New Project</Button>
            </div>
          }
        >
          Recent projects
        </SectionLabel>
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg border border-wire-border bg-wire-bg-2" />
            ))}
          </div>
        ) : recent.length > 0 ? (
          view === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {recent.map((p) => (
                <ProjectCard key={p.id} name={p.name} meta={recentMeta(p)} fav={favs.has(p.id)} onFav={(e) => { e.stopPropagation(); toggleFav(p.id); }} onClick={() => openProject(p.id)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((p) => (
                <ProjectRow key={p.id} name={p.name} meta={recentMeta(p)} fav={favs.has(p.id)} onFav={(e) => { e.stopPropagation(); toggleFav(p.id); }} onClick={() => openProject(p.id)} />
              ))}
            </div>
          )
        ) : (
          <div className="rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-12 text-center">
            <p className="text-sm font-semibold text-wire-text">{favOnly ? 'No favorites yet' : 'No projects yet'}</p>
            <p className="mt-1 text-xs text-wire-muted">{favOnly ? 'Star a project to pin it here.' : 'Create your first production to see it here.'}</p>
            <div className="mt-3">
              {favOnly
                ? <Button variant="secondary" size="sm" onClick={() => setFavOnly(false)}>Show all</Button>
                : <Button size="sm" onClick={() => navigate(ROUTES.createProject)}>+ New Project</Button>}
            </div>
          </div>
        )}
      </section>

      {/* 5 — Drafts */}
      {drafts.length > 0 ? (
        <section>
          <SectionLabel action={<button onClick={() => navigate(ROUTES.projects)} className="text-xs font-medium text-brand hover:underline">View all</button>}>
            Drafts
          </SectionLabel>
          <div className="grid grid-cols-3 gap-4">
            {drafts.map((p) => (
              <ProjectCard key={p.id} name={p.name} meta={draftMeta(p)} fav={favs.has(p.id)} onFav={(e) => { e.stopPropagation(); toggleFav(p.id); }} onClick={() => openProject(p.id)} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 6 — Archived (collapsed, kept separate) */}
      {archivedCount > 0 ? (
        <section>
          <div className="flex items-center justify-between rounded-lg border border-dashed border-wire-border bg-wire-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-wire-bg-2 text-wire-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18v4H3zM5 11v9h14v-9M10 15h4" /></svg>
              </span>
              <div>
                <p className="text-sm font-medium text-wire-text">Archived projects</p>
                <p className="text-xs text-wire-muted">Kept separate from active work</p>
              </div>
            </div>
            <button onClick={() => navigate(ROUTES.projects)} className="text-sm font-medium text-wire-muted hover:text-brand">View archived · {archivedCount} →</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
