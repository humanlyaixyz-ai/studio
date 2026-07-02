import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from './routes';
import { HeaderControls } from './HeaderControls';

/**
 * AppShell — OVARLY hi-fi base shell (fixed left sidebar + top header) for all
 * top-level nav pages. Ported from the lo-fi wireframe AppShell, rendered in the
 * light theme with the brand accent (#156EF4). Structure preserved 1:1.
 */

const ic = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const ICON: Record<string, JSX.Element> = {
  Dashboard: ic('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'),
  Projects: ic('M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7'),
  Looks: ic('M12 3l2.6 5.6L20.5 9l-4.2 4 1 6L12 20l-5.3 -1 1-6L3.5 9l5.9-.4z'),
  'Assets Library': ic('M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5'),
  'Brand Kits': ic('M4 4h16v6H4zM4 14h7v6H4zM14 14h6v6h-6z'),
  Settings: ic('M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 13a7.9 7.9 0 000-2l2-1.5-2-3.4-2.3 1a8 8 0 00-1.7-1L14.9 3H9.1l-.5 2.6a8 8 0 00-1.7 1l-2.3-1-2 3.4L4.6 11a7.9 7.9 0 000 2l-2 1.5 2 3.4 2.3-1a8 8 0 001.7 1l.5 2.6h5.8l.5-2.6a8 8 0 001.7-1l2.3 1 2-3.4z'),
  Reports: ic('M4 20V10M10 20V4M16 20v-8M22 20H2'),
  Billing: ic('M3 6h18v12H3zM3 10h18M7 15h4'),
};

const NAV: { label: string; to: string }[] = [
  { label: 'Dashboard', to: ROUTES.dashboard },
  { label: 'Projects', to: ROUTES.projects },
  { label: 'Looks', to: ROUTES.lookLibrary },
  { label: 'Assets Library', to: ROUTES.assetsLibrary },
  { label: 'Brand Kits', to: ROUTES.brandKits },
  { label: 'Settings', to: ROUTES.settings },
  { label: 'Reports', to: ROUTES.reports },
  { label: 'Billing', to: ROUTES.billing },
];

const TITLES: Record<string, string> = {
  [ROUTES.dashboard]: 'Dashboard',
  [ROUTES.projects]: 'Projects',
  [ROUTES.lookLibrary]: 'Look Library',
  [ROUTES.lookLibraryEmpty]: 'Look Library',
  [ROUTES.assetsLibrary]: 'Assets Library',
  [ROUTES.assetsLibraryEmpty]: 'Assets Library',
  [ROUTES.notifications]: 'Notifications',
  [ROUTES.settings]: 'Settings',
  [ROUTES.billing]: 'Billing',
  [ROUTES.brandKits]: 'Brand Kits',
  [ROUTES.reports]: 'Reports',
  [ROUTES.lookEditor]: 'Look Editor',
};

function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-wire-border bg-wire-surface">
      {/* logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-wire-border px-5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-brand text-[15px] font-extrabold text-white">O</div>
        <span className="text-base font-semibold tracking-tight text-wire-text">
          OVARLY <span className="text-xs font-bold uppercase text-brand">beta</span>
        </span>
      </div>

      {/* primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 ov-scroll">
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-wire-faint">Menu</p>
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                className={({ isActive }) => [
                  'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
                  isActive ? 'bg-brand-weak font-semibold text-brand' : 'font-medium text-wire-muted hover:bg-wire-bg hover:text-wire-text',
                ].join(' ')}
              >
                <span className="grid place-items-center">{ICON[item.label]}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* API Credits Usage card pinned to bottom */}
      <NavLink to={ROUTES.billing} className="m-3 rounded-lg border border-wire-border bg-wire-bg p-3 transition-colors hover:border-wire-border-strong">
        <p className="text-xs font-medium uppercase tracking-wide text-wire-faint">API Credits Usage</p>
        <p className="mt-1 text-sm font-semibold text-wire-text">8,200 <span className="text-wire-muted">/ 10,000</span></p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-wire-border">
          <div className="h-full w-4/5 rounded-full bg-brand" />
        </div>
        <p className="mt-1 text-[10px] text-wire-faint">Resets in 12 days</p>
      </NavLink>
    </aside>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header className="relative flex h-16 shrink-0 items-center gap-4 border-b border-wire-border bg-wire-surface px-6">
      <h1 className="text-lg font-semibold text-wire-text">{title}</h1>
      <label className="mx-auto flex h-9 w-full max-w-xl items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3 focus-within:border-brand focus-within:bg-wire-surface">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted" placeholder="Search workspace…" />
      </label>
      <HeaderControls />
    </header>
  );
}

export function AppShellLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || 'OVARLY';
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto bg-wire-bg p-6 ov-scroll">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  );
}
