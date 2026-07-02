import React from 'react';
import { useLocation } from 'react-router-dom';

/* Generic screen scaffold. Each route renders this until its real
   UI (from the incoming design code) is dropped in. Keeps routing +
   shell verifiable end-to-end from day one. */
export default function Placeholder({ name, note }: { name: string; note?: string }) {
  const { pathname } = useLocation();
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.tag}>SCREEN</div>
        <h2 style={s.name}>{name}</h2>
        <code style={s.route}>{pathname}</code>
        <p style={s.note}>{note || 'Scaffold ready — awaiting design code to implement the real UI.'}</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'grid', placeItems: 'center', minHeight: '60vh' },
  card: {
    maxWidth: 440, textAlign: 'center', padding: 32, borderRadius: 'var(--r-xl)',
    background: 'var(--surface)', border: '1px dashed var(--border-strong)',
  },
  tag: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand)', marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
  route: {
    display: 'inline-block', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-2)',
    background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '3px 8px',
  },
  note: { fontSize: 13, color: 'var(--text-3)', marginTop: 14, lineHeight: 1.5 },
};
