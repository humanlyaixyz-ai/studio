import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill } from '../kit';

/**
 * Settings — hi-fi build of SettingsWireframe.
 * Surface-level account cluster. Sections: General · Account · Workspace ·
 * Notifications · Privacy. Two-pane: left settings sub-nav (search + grouped) +
 * right section content. Shell (sidebar + header) is provided by AppShell.
 */

const sic = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const SECTION_ICON: Record<string, ReactNode> = {
  General: sic('M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 13a7.9 7.9 0 000-2l2-1.5-2-3.4-2.3 1a8 8 0 00-1.7-1L14.9 3H9.1l-.5 2.6a8 8 0 00-1.7 1l-2.3-1-2 3.4L4.6 11a7.9 7.9 0 000 2l-2 1.5 2 3.4 2.3-1a8 8 0 001.7 1l.5 2.6h5.8l.5-2.6a8 8 0 001.7-1l2.3 1 2-3.4z'),
  Account: sic('M12 12a4 4 0 100-8 4 4 0 000 8zM5 20c0-3.3 3.1-6 7-6s7 2.7 7 6'),
  Workspace: sic('M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 11h.01M15 11h.01'),
  Notifications: sic('M6 8a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 004 0'),
  Privacy: sic('M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z'),
};

const SECTIONS = ['General', 'Account', 'Workspace', 'Notifications', 'Privacy'];

/* ---------- shared bits ---------- */

function Switch({ on: initial = false }: { on?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className={['inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors', on ? 'justify-end bg-brand' : 'justify-start bg-wire-border'].join(' ')}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow-card" />
    </button>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
      <p className="text-sm font-semibold text-wire-text">{title}</p>
      {desc ? <p className="mt-0.5 text-xs text-wire-muted">{desc}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-wire-muted">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex h-9 flex-1 items-center rounded-md border border-wire-border bg-wire-bg px-3 text-sm text-wire-text">{value}</div>
        {badge ? <Pill tone="ok">{badge}</Pill> : null}
      </div>
    </div>
  );
}

function Dropdown({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-wire-muted">{label}</p>
      <div className="flex h-9 w-64 cursor-pointer items-center justify-between rounded-md border border-wire-border bg-wire-surface px-3 text-sm text-wire-text hover:border-wire-border-strong">
        {value}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-muted" aria-hidden><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
}

function ToggleRow({ title, desc, on }: { title: string; desc: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-wire-text">{title}</p>
        <p className="text-xs text-wire-muted">{desc}</p>
      </div>
      <Switch on={on} />
    </div>
  );
}

/* ---------- sections ---------- */

function General() {
  const [appearance, setAppearance] = useState('System');
  return (
    <div className="space-y-5">
      <Card title="Appearance" desc="How OVARLY looks on this device.">
        <div className="inline-flex rounded-md border border-wire-border bg-wire-bg p-0.5">
          {['Light', 'Dark', 'System'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setAppearance(m)}
              className={['rounded px-4 py-1.5 text-sm font-medium transition-colors', m === appearance ? 'bg-brand text-white shadow-card' : 'text-wire-muted hover:text-wire-text'].join(' ')}
            >
              {m}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Preferences">
        <div className="flex flex-wrap gap-6">
          <Dropdown label="Language" value="English (US)" />
          <Dropdown label="Default image model" value="Krea 2 Large" />
        </div>
      </Card>
    </div>
  );
}

function Account() {
  return (
    <div className="space-y-5">
      <Card title="Profile" desc="Your personal details.">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-weak text-brand" aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zM5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>
          </div>
          <Button variant="secondary" size="sm">Change photo</Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Full name" value="Alex Morgan" />
          <Field label="Email" value="alex@studio.com" badge="Verified" />
        </div>
      </Card>
      <Card title="Password" desc="Set a strong password to keep your account secure.">
        <Button variant="secondary" size="sm">Change password</Button>
      </Card>
      <Card title="Danger zone" desc="Permanently delete your account and personal data.">
        <Button variant="danger" size="sm">Delete account</Button>
      </Card>
    </div>
  );
}

function Workspace() {
  const members = [
    { name: 'Alex Morgan', email: 'alex@studio.com', role: 'Owner' },
    { name: 'Jordan Lee', email: 'jordan@studio.com', role: 'Admin' },
    { name: 'Sam Carter', email: 'sam@studio.com', role: 'Editor' },
  ];
  return (
    <div className="space-y-5">
      <Card title="Workspace" desc="Shared by everyone in your organisation.">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-md bg-brand-weak text-brand" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" /></svg>
          </div>
          <Button variant="secondary" size="sm">Upload logo</Button>
        </div>
        <div className="mt-4 max-w-md"><Field label="Workspace name" value="Studio Atelier" /></div>
      </Card>
      <Card title="Members" desc="People with access to this workspace.">
        <div className="overflow-hidden rounded-md border border-wire-border">
          {members.map((m, i) => (
            <div key={m.email} className={['flex items-center gap-3 px-4 py-3', i > 0 ? 'border-t border-wire-border' : ''].join(' ')}>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-weak text-brand" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zM5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-wire-text">{m.name}</p>
                <p className="text-xs text-wire-muted">{m.email}</p>
              </div>
              <Pill tone={m.role === 'Owner' ? 'brand' : 'neutral'}>{m.role}</Pill>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button size="sm">Invite member</Button>
          <span className="rounded-full border border-wire-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-wire-muted">Advanced roles &amp; permissions — next update</span>
        </div>
      </Card>
    </div>
  );
}

function Notifications() {
  const rows = [
    { title: 'Generation complete', desc: 'When a batch finishes generating.', on: true },
    { title: 'Low credits', desc: 'When your balance runs low.', on: true },
    { title: 'Invoices & billing', desc: 'Payments, refunds and receipts.', on: true },
    { title: 'Product updates', desc: 'New features and announcements.', on: false },
  ];
  return (
    <Card title="Notifications" desc="Choose what you're notified about.">
      <div className="overflow-hidden rounded-md border border-wire-border">
        <div className="flex items-center bg-wire-bg px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-wire-muted">
          <span className="flex-1">Type</span>
          <span className="w-20 text-center">Email</span>
          <span className="w-20 text-center">In-app</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.title} className={['flex items-center px-4 py-3', i > 0 ? 'border-t border-wire-border' : ''].join(' ')}>
            <div className="flex-1">
              <p className="text-sm font-medium text-wire-text">{r.title}</p>
              <p className="text-xs text-wire-muted">{r.desc}</p>
            </div>
            <span className="flex w-20 justify-center"><Switch on={r.on} /></span>
            <span className="flex w-20 justify-center"><Switch on /></span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Privacy() {
  return (
    <div className="space-y-5">
      <Card title="Data & privacy" desc="Control how your data is used.">
        <div className="divide-y divide-wire-border">
          <ToggleRow title="Usage analytics" desc="Help improve OVARLY with anonymous usage data." on={true} />
          <ToggleRow title="Marketing emails" desc="Occasional product news and offers." on={false} />
        </div>
      </Card>
      <Card title="Your data">
        <Button variant="secondary" size="sm">Download my data</Button>
      </Card>
      <Card title="Danger zone" desc="Permanently delete this workspace and all its projects.">
        <Button variant="danger" size="sm">Delete workspace</Button>
      </Card>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [section, setSection] = useState('General');
  const [query, setQuery] = useState('');
  const shown = SECTIONS.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="mx-auto flex max-w-6xl gap-6">
      {/* settings sub-nav */}
      <aside className="w-60 shrink-0">
        <label className="mb-3 flex h-9 items-center gap-2 rounded-md border border-wire-border bg-wire-surface px-3 focus-within:border-brand">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted"
            placeholder="Search"
          />
        </label>
        <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-wire-faint">Settings</p>
        <ul className="space-y-1">
          {shown.length === 0 ? <li className="px-2.5 py-2 text-xs text-wire-faint">No matching settings</li> : null}
          {shown.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setSection(s)}
                className={['flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors', s === section ? 'bg-brand-weak font-semibold text-brand' : 'font-medium text-wire-muted hover:bg-wire-bg hover:text-wire-text'].join(' ')}
              >
                <span className="grid place-items-center">{SECTION_ICON[s]}</span>
                {s}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-wire-border pt-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.billing)}
            className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-wire-muted transition-colors hover:bg-wire-bg hover:text-wire-text"
          >
            <span className="grid place-items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18v12H3zM3 10h18M7 15h4" /></svg>
            </span>
            Billing
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="ml-auto text-wire-faint" aria-hidden><path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </aside>

      {/* section content */}
      <div className="min-w-0 flex-1">
        <h2 className="mb-4 text-xl font-semibold text-wire-text">{section}</h2>
        {section === 'General' ? <General /> : null}
        {section === 'Account' ? <Account /> : null}
        {section === 'Workspace' ? <Workspace /> : null}
        {section === 'Notifications' ? <Notifications /> : null}
        {section === 'Privacy' ? <Privacy /> : null}
      </div>
    </div>
  );
}
