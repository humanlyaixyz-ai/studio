import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import * as db from '../../services/dbService';
import type { ActivityItem } from '../../services/dbService';

/**
 * Notifications — REAL activity feed derived from recent projects + generation batches
 * (db.loadActivity). No notifications table; read-state is kept locally. Shell = AppShell.
 */

const ico = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

const relTime = (ts: number) => {
  if (!ts) return '';
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};

function bucketOf(ts: number): 'Today' | 'Yesterday' | 'Earlier' {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (ts >= startToday) return 'Today';
  if (ts >= startToday - 86_400_000) return 'Yesterday';
  return 'Earlier';
}

const LS_READ = 'ovarly.notifications.read';

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [read, setRead] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_READ) || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    let cancelled = false;
    db.loadActivity().then((rows) => { if (!cancelled) setItems(rows); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const persistRead = (next: Set<string>) => {
    setRead(next);
    try { localStorage.setItem(LS_READ, JSON.stringify([...next])); } catch { /* ignore */ }
  };
  const markRead = (id: string) => persistRead(new Set(read).add(id));
  const markAll = () => persistRead(new Set(items.map((i) => i.id)));

  const groups = useMemo(() => {
    const order: ('Today' | 'Yesterday' | 'Earlier')[] = ['Today', 'Yesterday', 'Earlier'];
    return order
      .map((label) => ({ label, items: items.filter((i) => bucketOf(i.timestamp) === label) }))
      .filter((g) => g.items.length > 0);
  }, [items]);

  const unread = items.filter((i) => !read.has(i.id)).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-wire-text">Notifications</h2>
          <p className="mt-1 text-sm text-wire-muted">{unread > 0 ? `${unread} unread` : 'You’re all caught up.'}</p>
        </div>
        {unread > 0 ? <button type="button" onClick={markAll} className="text-sm font-medium text-brand hover:underline">Mark all read</button> : null}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-wire-bg-2" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-16 text-center">
          <p className="text-sm font-semibold text-wire-text">No activity yet</p>
          <p className="mt-1 text-sm text-wire-muted">Create a project or generate images and it’ll show up here.</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.label}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-wire-muted">{g.label}</p>
            <div className="overflow-hidden rounded-lg border border-wire-border bg-wire-surface">
              {g.items.map((it, idx) => {
                const isUnread = !read.has(it.id);
                const isGen = it.kind === 'generation';
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => { markRead(it.id); navigate(isGen ? ROUTES.output : ROUTES.projectOverview); }}
                    className={['flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-wire-bg', idx > 0 ? 'border-t border-wire-border' : '', isUnread ? 'bg-brand-weak/30' : ''].join(' ')}
                  >
                    <span className={['grid h-9 w-9 shrink-0 place-items-center rounded-full', isGen ? 'bg-brand-weak text-brand' : 'bg-ok-weak text-ok'].join(' ')}>
                      {isGen ? ico('M3 4h18v14H3zM3 15l4-4 4 4 3-3 4 4', 16) : ico('M12 5v14M5 12h14', 16)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-wire-text">{it.title}</p>
                      <p className="truncate text-xs text-wire-muted">{it.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-wire-muted">{relTime(it.timestamp)}</span>
                    {isUnread ? <span className="h-2 w-2 shrink-0 rounded-full bg-brand" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
