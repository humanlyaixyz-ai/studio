import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill, SectionLabel, Card } from '../kit';

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

const QUICK_ACTIONS = [
  { title: 'Create Project', hint: 'Start a new production', to: ROUTES.createProject, icon: sic('M12 5v14M5 12h14') },
  { title: 'Create Look', hint: 'A reusable look + background preset', to: ROUTES.lookLibrary, icon: sic('M12 3l2.6 5.6L20.5 9l-4.2 4 1 6L12 20l-5.3 -1 1-6L3.5 9l5.9-.4z') },
  { title: 'Upload Assets', hint: 'Add to Assets Library', to: ROUTES.assetsLibrary, icon: sic('M12 16V4M7 9l5-5 5 5M4 20h16') },
  { title: 'Import Brand Kit', hint: 'Reuse a brand system', to: ROUTES.brandKits, icon: sic('M4 4h16v6H4zM4 14h7v6H4zM14 14h6v6h-6z') },
];

const RECENT = [
  { name: 'Nike Summer Campaign', meta: 'Edited 2 hours ago' },
  { name: 'Zara Editorial Shoot', meta: 'Edited 1 day ago' },
  { name: 'Lifestyle Collection', meta: 'Edited 2 days ago' },
  { name: 'E-Commerce — Tops', meta: 'Edited 3 days ago' },
  { name: 'Jewelry Campaign', meta: 'Edited 4 days ago' },
  { name: 'Streetwear Lookbook', meta: 'Edited 5 days ago' },
];

const DRAFTS = [
  { name: 'Untitled Project', meta: 'Setup incomplete · 1 day ago' },
  { name: 'Spring Drop — Draft', meta: 'No service types · 3 days ago' },
];

function ProjectCard({ name, meta, onClick }: { name: string; meta: string; onClick?: () => void }) {
  return (
    <Card hover className="cursor-pointer overflow-hidden" >
      <div onClick={onClick}>
        <div className="relative flex h-32 items-center justify-center border-b border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
          <span className="text-xs text-wire-faint">Preview</span>
          <button className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-wire-border bg-wire-surface/80 text-wire-muted backdrop-blur hover:text-brand" aria-label="Favorite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.6 5.6L20.5 9l-4.2 4 1 6L12 20l-5.3 -1 1-6L3.5 9l5.9-.4z" /></svg>
          </button>
        </div>
        <div className="flex items-center justify-between p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-wire-text">{name}</p>
            <p className="text-xs text-wire-muted">{meta}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-wire-bg-2" aria-hidden />
            <button className="text-wire-faint hover:text-wire-text" aria-label="More">⋯</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
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
      <section>
        <SectionLabel>Continue working</SectionLabel>
        <Card className="flex items-center gap-4 p-4">
          <div className="h-24 w-32 shrink-0 rounded-md bg-gradient-to-br from-wire-bg-2 to-wire-bg" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-wire-text">Nike Summer Campaign</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill>24 SKUs</Pill>
              <Pill>3 Service Types</Pill>
              <Pill>Last edited 2 hours ago</Pill>
            </div>
            <p className="mt-3 text-xs text-wire-muted">Setup in progress · next: Service Setup</p>
          </div>
          <Button onClick={() => navigate(ROUTES.projectOverview)}>Resume</Button>
        </Card>
      </section>

      {/* 4 — Recent Projects */}
      <section>
        <SectionLabel
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">Filter</Button>
              <Button variant="secondary" size="sm">Sort</Button>
              <div className="flex overflow-hidden rounded-md border border-wire-border">
                <span className="border-r border-wire-border bg-brand-weak px-2 py-1.5 text-brand">▦</span>
                <span className="px-2 py-1.5 text-wire-muted">≡</span>
              </div>
              <Button size="sm" onClick={() => navigate(ROUTES.createProject)}>+ New Project</Button>
            </div>
          }
        >
          Recent projects
        </SectionLabel>
        <div className="grid grid-cols-3 gap-4">
          {RECENT.map((p) => (
            <ProjectCard key={p.name} name={p.name} meta={p.meta} onClick={() => navigate(ROUTES.projectOverview)} />
          ))}
        </div>
      </section>

      {/* 5 — Drafts */}
      <section>
        <SectionLabel action={<button onClick={() => navigate(ROUTES.projects)} className="text-xs font-medium text-brand hover:underline">View all</button>}>
          Drafts
        </SectionLabel>
        <div className="grid grid-cols-3 gap-4">
          {DRAFTS.map((p) => (
            <ProjectCard key={p.name} name={p.name} meta={p.meta} onClick={() => navigate(ROUTES.projectOverview)} />
          ))}
        </div>
      </section>

      {/* 6 — Archived (collapsed, kept separate) */}
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
          <button onClick={() => navigate(ROUTES.projects)} className="text-sm font-medium text-wire-muted hover:text-brand">View archived · 12 →</button>
        </div>
      </section>
    </div>
  );
}
