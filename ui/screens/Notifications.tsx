import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

/**
 * Notifications — hi-fi build of NotificationsWireframe.
 * Timeline grouped by day; each item is unread/read and carries a contextual action button.
 * Shell is provided by AppShell.
 */

type Notif = { title: string; desc: string; time: string; unread: boolean; action: string; to: string };

const GROUPS: { when: string; items: Notif[] }[] = [
  {
    when: 'Today',
    items: [
      { title: 'Generation complete', desc: 'Nike Summer Campaign · 24 images ready to review', time: '2m ago', unread: true, action: 'View results', to: ROUTES.generationCanvas },
      { title: 'Low on credits', desc: '240 credits left — top up to keep generating', time: '1h ago', unread: true, action: 'Top up', to: ROUTES.billing },
      { title: 'Review requested', desc: 'Jordan asked you to review 6 SKUs in Zara Editorial', time: '3h ago', unread: true, action: 'Review', to: ROUTES.review },
    ],
  },
  {
    when: 'Yesterday',
    items: [
      { title: 'Invoice paid', desc: 'US$49 · Studio plan renewed', time: '1d ago', unread: false, action: 'View invoice', to: ROUTES.billing },
      { title: 'Look saved to library', desc: '“Clean Studio — Tops” is now reusable', time: '1d ago', unread: false, action: 'View Look', to: ROUTES.lookLibrary },
    ],
  },
  {
    when: 'Earlier',
    items: [
      { title: 'Export ready', desc: 'Lifestyle Collection · 40 images packaged', time: '3d ago', unread: false, action: 'Download', to: ROUTES.output },
      { title: 'SKUs need attention', desc: '2 SKUs missing angles in Summer Campaign', time: '4d ago', unread: false, action: 'Fix SKUs', to: ROUTES.addSkuStored },
    ],
  },
];

export default function Notifications() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* heading + actions */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-wire-text">Notifications</h2>
          <p className="mt-1 text-sm text-wire-muted">Activity across your projects, credits and team.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">Mark all read</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.settings)}>Settings</Button>
        </div>
      </div>

      {/* filters */}
      <div className="flex items-center gap-2">
        {['All', 'Unread', 'Mentions'].map((f, i) => (
          <span key={f} className={['cursor-pointer rounded-full border px-3 py-1 text-xs font-medium', i === 0 ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong hover:text-wire-text'].join(' ')}>{f}</span>
        ))}
      </div>

      {/* timeline */}
      <div className="space-y-8">
        {GROUPS.map((g) => (
          <section key={g.when}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-wire-muted">{g.when}</p>
            <div className="relative pl-6">
              <div className="absolute bottom-2 left-[5px] top-2 w-px bg-wire-border" aria-hidden />
              <div className="space-y-3">
                {g.items.map((n, i) => (
                  <div key={i} className="relative">
                    <span
                      className={['absolute -left-[23px] top-4 h-2.5 w-2.5 rounded-full border-2 border-wire-surface', n.unread ? 'bg-brand' : 'bg-wire-border'].join(' ')}
                      aria-hidden
                    />
                    <div className={['flex items-center justify-between gap-4 rounded-lg border bg-wire-surface p-4 transition-shadow hover:shadow-card', n.unread ? 'border-brand-weak-2 bg-brand-weak/30' : 'border-wire-border'].join(' ')}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-wire-text">{n.title}</p>
                          {n.unread ? <span className="rounded-full border border-brand-weak-2 bg-brand-weak px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-brand">New</span> : null}
                        </div>
                        <p className="mt-0.5 text-xs text-wire-muted">{n.desc}</p>
                        <p className="mt-1 text-[11px] text-wire-faint">{n.time}</p>
                      </div>
                      <Button variant={n.unread ? 'primary' : 'secondary'} size="sm" onClick={() => navigate(n.to)}>{n.action}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
