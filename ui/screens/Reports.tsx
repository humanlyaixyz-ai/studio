import { useEffect, useMemo, useState } from 'react';
import * as db from '../../services/dbService';
import type { StudioStats } from '../../services/dbService';

/**
 * Reports — REAL studio analytics computed from live data (projects, SKUs, generation
 * batches, generated images) via db.loadStudioStats. No new schema. Shell = AppShell.
 */

const ico = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <div className="rounded-xl border border-wire-border bg-wire-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-wire-muted">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-weak text-brand">{ico(icon, 16)}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-wire-text">{value}</p>
      {sub ? <p className="mt-1 text-xs text-wire-muted">{sub}</p> : null}
    </div>
  );
}

export default function Reports() {
  const [stats, setStats] = useState<StudioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    db.loadStudioStats()
      .then((s) => { if (!cancelled) setStats(s); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load reports'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const successRate = stats && stats.images > 0 ? Math.round((stats.successImages / stats.images) * 100) : 0;
  const maxDay = useMemo(() => Math.max(1, ...(stats?.last14Days.map((d) => d.count) || [1])), [stats]);
  const maxModel = useMemo(() => Math.max(1, ...(stats?.byModel.map((m) => m.images) || [1])), [stats]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Reports</h2>
        <p className="mt-1 text-sm text-wire-muted">Production analytics across your whole studio.</p>
      </div>

      {error ? (
        <div className="rounded-md border border-danger/40 bg-danger-weak px-3 py-2 text-sm text-wire-text"><span className="font-semibold text-danger">Error:</span> {error}</div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-wire-bg-2" />)}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Projects" value={String(stats.projects)} sub={`${stats.skus} SKUs`} icon="M4 5h16v14H4zM4 9h16M9 5v14" />
            <Kpi label="Images generated" value={String(stats.successImages)} sub={`${stats.batches} generations`} icon="M3 4h18v14H3zM3 15l4-4 4 4 3-3 4 4" />
            <Kpi label="Success rate" value={`${successRate}%`} sub={`${stats.failedImages} failed`} icon="M20 6 9 17l-5-5" />
            <Kpi label="Avg / generation" value={stats.batches ? (stats.successImages / stats.batches).toFixed(1) : '0'} sub="images per batch" icon="M3 12h4l3 8 4-16 3 8h4" />
          </div>

          {/* Images per day — last 14 days */}
          <div className="rounded-xl border border-wire-border bg-wire-surface p-5 shadow-card">
            <p className="text-sm font-semibold text-wire-text">Images generated · last 14 days</p>
            {stats.successImages === 0 ? (
              <p className="mt-6 text-center text-sm text-wire-muted">No generated images yet.</p>
            ) : (
              <div className="mt-5 flex items-end gap-2" style={{ height: 160 }}>
                {stats.last14Days.map((d) => (
                  <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-brand transition-all"
                        style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                        title={`${d.count} image${d.count === 1 ? '' : 's'} · ${d.label}`}
                      />
                    </div>
                    <span className="text-[9px] text-wire-muted">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By model */}
          <div className="rounded-xl border border-wire-border bg-wire-surface p-5 shadow-card">
            <p className="text-sm font-semibold text-wire-text">By shoot model</p>
            {stats.byModel.length === 0 ? (
              <p className="mt-4 text-sm text-wire-muted">No generations yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {stats.byModel.map((m) => (
                  <div key={m.model} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm text-wire-text">{m.model.replace(/_/g, ' ').toLowerCase()}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-wire-bg-2">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(m.images / maxModel) * 100}%` }} />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-medium text-wire-text">{m.images}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
