import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from './routes';

/* ------------------------------------------------------------------
   App shell (all top-level pages): fixed Sidebar + persistent Header
   + scrollable content area (24px padding).
   Structural scaffold, token-driven. Visuals get refined per the
   incoming design code.
------------------------------------------------------------------ */

type IconProps = { d: string };
const Icon = ({ d }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

// Minimal line-icon paths (placeholder set)
const ICONS = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  projects:  'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7',
  looks:     'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z',
  assets:    'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5',
  brandKits: 'M4 4h16v6H4zM4 14h7v6H4zM14 14h6v6h-6z',
  settings:  'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.3 1a7 7 0 00-1.7-1L14.5 2h-5l-.4 2.6a7 7 0 00-1.7 1l-2.3-1-2 3.4L3 11a7 7 0 000 2l-2 1.6 2 3.4 2.3-1a7 7 0 001.7 1l.4 2.4h5l.4-2.6a7 7 0 001.7-1l2.3 1 2-3.4-2-1.6a7 7 0 00.1-1z',
  reports:   'M4 20V10M10 20V4M16 20v-8M22 20H2',
  billing:   'M3 6h18v12H3zM3 10h18M7 15h4',
  bell:      'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  search:    'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
};

const NAV = [
  { to: ROUTES.dashboard,     label: 'Dashboard',      icon: ICONS.dashboard },
  { to: ROUTES.projects,      label: 'Projects',       icon: ICONS.projects },
  { to: ROUTES.lookLibrary,   label: 'Looks',          icon: ICONS.looks },
  { to: ROUTES.assetsLibrary, label: 'Assets Library', icon: ICONS.assets },
  { to: ROUTES.brandKits,     label: 'Brand Kits',     icon: ICONS.brandKits, soon: true },
  { to: ROUTES.settings,      label: 'Settings',       icon: ICONS.settings },
  { to: ROUTES.reports,       label: 'Reports',        icon: ICONS.reports, soon: true },
  { to: ROUTES.billing,       label: 'Billing',        icon: ICONS.billing },
];

// Human-readable page titles keyed by pathname
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
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoMark}>O</div>
        <span style={s.logoText}>OVARLY <span style={s.logoBeta}>beta</span></span>
      </div>

      {/* Primary nav */}
      <nav style={s.nav} className="ov-scroll">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            ...s.navItem, ...(isActive ? s.navItemActive : null),
          })}>
            <span style={s.navIcon}><Icon d={item.icon} /></span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.soon && <span style={s.soon}>soon</span>}
          </NavLink>
        ))}
      </nav>

      {/* API Credits Usage card pinned to bottom */}
      <div style={s.credits}>
        <div style={s.creditsHead}>
          <span style={s.creditsLabel}>API Credits</span>
          <span style={s.creditsVal}>7,240</span>
        </div>
        <div style={s.creditsBar}><div style={s.creditsFill} /></div>
        <div style={s.creditsSub}>72% of monthly quota</div>
      </div>
    </aside>
  );
}

function Header() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || 'OVARLY';
  return (
    <header style={s.header}>
      <h1 style={s.title}>{title}</h1>

      <div style={s.searchWrap}>
        <span style={s.searchIcon}><Icon d={ICONS.search} /></span>
        <input style={s.search} placeholder="Search workspace…" />
      </div>

      <div style={s.headerRight}>
        <button style={s.iconBtn} aria-label="Notifications"><Icon d={ICONS.bell} /></button>
        <div style={s.avatar}>H</div>
      </div>
    </header>
  );
}

export default function AppShell() {
  return (
    <div style={s.root}>
      <Sidebar />
      <div style={s.main}>
        <Header />
        <main style={s.content} className="ov-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', minHeight: '100vh', background: 'var(--bg)' },

  // Sidebar
  sidebar: {
    width: 'var(--sidebar-w)', flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
    background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', padding: '16px 12px',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 18px' },
  logoMark: {
    width: 28, height: 28, borderRadius: 'var(--r-md)', background: 'var(--brand)',
    color: 'var(--white)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15,
  },
  logoText: { fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '0.02em' },
  logoBeta: { fontSize: 10, fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', marginLeft: 2 },

  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto', marginTop: 4 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--r-md)',
    color: 'var(--text-2)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
    transition: 'background var(--dur) var(--ease), color var(--dur) var(--ease)',
  },
  navItemActive: { background: 'var(--brand-weak)', color: 'var(--brand)', fontWeight: 600 },
  navIcon: { display: 'grid', placeItems: 'center' },
  soon: {
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
    color: 'var(--text-4)', border: '1px solid var(--border)', borderRadius: 'var(--r-pill)', padding: '1px 6px',
  },

  credits: {
    marginTop: 12, padding: 12, borderRadius: 'var(--r-lg)',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
  },
  creditsHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  creditsLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-2)' },
  creditsVal: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  creditsBar: { height: 6, borderRadius: 'var(--r-pill)', background: 'var(--n-200)', overflow: 'hidden' },
  creditsFill: { width: '72%', height: '100%', background: 'var(--brand)', borderRadius: 'var(--r-pill)' },
  creditsSub: { fontSize: 11, color: 'var(--text-3)', marginTop: 6 },

  // Main column
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },

  // Header
  header: {
    height: 'var(--header-h)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10,
    background: 'var(--header-bg)', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px',
  },
  title: { fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0, minWidth: 160 },
  searchWrap: { flex: 1, maxWidth: 520, margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 12, color: 'var(--text-4)', display: 'grid', placeItems: 'center' },
  search: {
    width: '100%', height: 38, padding: '0 14px 0 38px', borderRadius: 'var(--r-pill)',
    border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)',
    fontSize: 13, outline: 'none',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 160, justifyContent: 'flex-end' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer',
  },
  avatar: {
    width: 34, height: 34, borderRadius: 'var(--r-pill)', background: 'var(--n-800)', color: 'var(--white)',
    display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },

  // Content
  content: { flex: 1, overflowY: 'auto', padding: 'var(--content-pad)' },
};
