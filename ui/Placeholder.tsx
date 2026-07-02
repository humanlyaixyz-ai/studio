import { useLocation } from 'react-router-dom';

/* Generic screen scaffold — each route renders this until its real hi-fi UI
   is ported from the wireframe. Keeps routing + shells verifiable throughout. */
export default function Placeholder({ name, note }: { name: string; note?: string }) {
  const { pathname } = useLocation();
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-xl border border-dashed border-wire-border-strong bg-wire-surface p-8 text-center">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-brand">Screen</p>
        <h2 className="mb-2.5 text-xl font-semibold text-wire-text">{name}</h2>
        <code className="inline-block rounded border border-wire-border bg-wire-bg px-2 py-1 font-mono text-xs text-wire-muted">{pathname}</code>
        <p className="mt-3.5 text-sm leading-relaxed text-wire-faint">{note || 'Scaffold ready — awaiting hi-fi build from the wireframe.'}</p>
      </div>
    </div>
  );
}
