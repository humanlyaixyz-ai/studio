import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { useProjects } from './data/projects';
import { SkusProvider } from './data/skus';

/* Project workspace shell (inside a project): multi-project tab bar + left
   project menu (free toggle) + content. Scaffold — refined as workspace
   screens are ported. Prerequisite gating shows at the SCREEN level. */

const PROJECT_MENU = [
  { to: ROUTES.projectOverview, label: 'Overview' },
  { to: ROUTES.serviceSetup, label: 'Service Setup' },
  { to: ROUTES.addSku, label: 'Add SKU' },
  { to: ROUTES.addSkuStored, label: 'SKUs' },
  { to: ROUTES.propsAssets, label: 'Props & Assets' },
  { to: ROUTES.generationCanvas, label: 'Generation' },
  { to: ROUTES.output, label: 'Output' },
  { to: ROUTES.review, label: 'Review' },
];

export default function WorkspaceShell() {
  const navigate = useNavigate();
  const { projects, selectedId } = useProjects();
  const activeName = projects.find((p) => p.id === selectedId)?.name || 'Untitled Project';

  return (
    <div className="flex h-full flex-col bg-wire-bg">
      {/* multi-project tab bar */}
      <div className="flex h-11 shrink-0 items-end gap-1.5 border-b border-wire-border bg-wire-bg-2 px-4">
        <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-wire-border bg-wire-surface px-3 py-2 text-sm font-semibold text-wire-text">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          <span className="max-w-[220px] truncate">{activeName}</span>
          <button onClick={() => navigate(ROUTES.dashboard)} className="ml-1 text-wire-faint hover:text-wire-text" aria-label="Close tab">✕</button>
        </div>
        <NavLink to={ROUTES.dashboard} className="px-2.5 py-2 text-xs text-wire-muted hover:text-wire-text">+ Dashboard</NavLink>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* left project menu */}
        <aside className="flex w-52 shrink-0 flex-col gap-1 overflow-y-auto border-r border-wire-border bg-wire-surface p-3 ov-scroll">
          {PROJECT_MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => [
                'rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-brand-weak font-semibold text-brand' : 'font-medium text-wire-muted hover:bg-wire-bg hover:text-wire-text',
              ].join(' ')}
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-6 ov-scroll">
          <SkusProvider>
            <Outlet />
          </SkusProvider>
        </main>
      </div>
    </div>
  );
}
