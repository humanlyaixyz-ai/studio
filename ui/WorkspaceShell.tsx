import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from './routes';

/* Project workspace shell (inside a project): multi-project tab bar
   header + left project menu (free toggle) + content. Scaffold only —
   refined per design code. Prerequisite gating is shown at the SCREEN
   level (locked states), never by hiding the menu. */

const PROJECT_MENU = [
  { to: ROUTES.projectOverview, label: 'Overview' },
  { to: ROUTES.serviceSetup,    label: 'Service Setup' },
  { to: ROUTES.addSku,          label: 'Add SKU' },
  { to: ROUTES.addSkuStored,    label: 'SKUs' },
  { to: ROUTES.propsAssets,     label: 'Props & Assets' },
  { to: ROUTES.generationCanvas,label: 'Generation' },
  { to: ROUTES.output,          label: 'Output' },
  { to: ROUTES.review,          label: 'Review' },
];

export default function WorkspaceShell() {
  return (
    <div style={s.root}>
      {/* Multi-project tab bar */}
      <div style={s.tabBar}>
        <div style={s.tab}>
          <span style={s.tabDot} />
          <span>Untitled Project</span>
          <button style={s.tabClose} aria-label="Close tab">✕</button>
        </div>
        <NavLink to={ROUTES.dashboard} style={s.tabAdd}>+ Dashboard</NavLink>
      </div>

      <div style={s.body}>
        {/* Left project menu */}
        <aside style={s.menu} className="ov-scroll">
          {PROJECT_MENU.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              ...s.menuItem, ...(isActive ? s.menuItemActive : null),
            })}>{item.label}</NavLink>
          ))}
        </aside>

        {/* Screen content */}
        <main style={s.content} className="ov-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' },
  tabBar: {
    height: 44, flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 16px',
    background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600,
    color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderBottom: 'none',
    borderRadius: 'var(--r-md) var(--r-md) 0 0',
  },
  tabDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)' },
  tabClose: { border: 'none', background: 'transparent', color: 'var(--text-4)', cursor: 'pointer', fontSize: 12, padding: 0, marginLeft: 4 },
  tabAdd: { fontSize: 12, color: 'var(--text-3)', padding: '8px 10px', cursor: 'pointer' },

  body: { flex: 1, display: 'flex', minHeight: 0 },
  menu: {
    width: 200, flexShrink: 0, padding: 12, background: 'var(--surface)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
  },
  menuItem: {
    padding: '9px 12px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
  },
  menuItemActive: { background: 'var(--brand-weak)', color: 'var(--brand)', fontWeight: 600 },
  content: { flex: 1, overflowY: 'auto', padding: 'var(--content-pad)', minWidth: 0 },
};
