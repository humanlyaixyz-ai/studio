import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from './routes';

/**
 * HeaderControls — shared notification bell + account avatar with pop-overs.
 * Ported from the lo-fi wireframe, rendered in the OVARLY hi-fi light theme.
 */

export const NOTIFS = [
  { title: 'Generation complete', desc: 'Nike Summer Campaign · 24 images', time: '2m', unread: true },
  { title: 'Low on credits', desc: '240 credits left — top up to continue', time: '1h', unread: true },
  { title: 'Invoice paid', desc: 'US$49 · Studio plan', time: '1d', unread: false },
];

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function HeaderControls() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<'bell' | 'avatar' | null>(null);
  const toggle = (m: 'bell' | 'avatar') => setOpen((c) => (c === m ? null : m));

  return (
    <div className="flex items-center gap-3">
      {/* notifications bell */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle('bell')}
          className="relative flex h-9 w-9 items-center justify-center rounded-md border border-wire-border bg-wire-surface text-wire-muted transition-colors hover:text-wire-text hover:border-wire-border-strong"
          aria-label="Notifications"
        >
          <BellIcon />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-wire-surface" aria-hidden />
        </button>
        {open === 'bell' && (
          <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop">
            <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
              <p className="text-sm font-semibold text-wire-text">Notifications</p>
              <button type="button" className="text-xs font-medium text-brand hover:underline">Mark all read</button>
            </div>
            <div className="max-h-80 overflow-y-auto ov-scroll">
              {NOTIFS.map((n, i) => (
                <div key={i} className={['flex gap-3 px-4 py-3', i > 0 ? 'border-t border-wire-border' : ''].join(' ')}>
                  <span className={['mt-1.5 h-2 w-2 shrink-0 rounded-full', n.unread ? 'bg-brand' : 'bg-transparent'].join(' ')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-wire-text">{n.title}</p>
                    <p className="text-xs text-wire-muted">{n.desc}</p>
                  </div>
                  <span className="text-[10px] text-wire-faint">{n.time}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setOpen(null); navigate(ROUTES.notifications); }}
              className="block w-full border-t border-wire-border px-4 py-2.5 text-center text-xs font-semibold text-brand hover:bg-brand-weak"
            >
              View all
            </button>
          </div>
        )}
      </div>

      {/* avatar menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle('avatar')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-wire-text text-xs font-semibold text-white"
          aria-label="Account"
        >
          AM
        </button>
        {open === 'avatar' && (
          <div className="absolute right-0 top-11 z-40 w-52 overflow-hidden rounded-xl border border-wire-border bg-wire-surface py-1 shadow-pop">
            <div className="border-b border-wire-border px-4 py-3">
              <p className="text-sm font-medium text-wire-text">Alex Morgan</p>
              <p className="text-xs text-wire-muted">alex@studio.com</p>
            </div>
            {([['Profile', ROUTES.settings], ['Settings', ROUTES.settings], ['Billing', ROUTES.billing]] as const).map(([label, to]) => (
              <button
                key={label}
                type="button"
                onClick={() => { setOpen(null); navigate(to); }}
                className="block w-full px-4 py-2 text-left text-sm text-wire-text hover:bg-wire-bg"
              >
                {label}
              </button>
            ))}
            <button type="button" className="block w-full border-t border-wire-border px-4 py-2 text-left text-sm text-wire-muted hover:bg-wire-bg">Log out</button>
          </div>
        )}
      </div>
    </div>
  );
}
