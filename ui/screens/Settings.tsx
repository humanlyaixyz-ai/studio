import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill } from '../kit';

/**
 * Settings — real, persisted to localStorage (no auth/workspace backend yet).
 * General (appearance, default model), Account (name/email), API Keys (the Gemini/Kie
 * keys generation actually reads), Notifications & Privacy toggles. Shell = AppShell.
 */

const sic = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

// ── tiny persisted-state helpers ────────────────────────────────────────────────
function readLS(key: string, fallback = ''): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function useLS(key: string, fallback = ''): [string, (v: string) => void] {
  const [v, setV] = useState<string>(() => readLS(key, fallback));
  const set = (next: string) => { setV(next); try { localStorage.setItem(key, next); } catch { /* ignore */ } };
  return [v, set];
}
function useBoolLS(key: string, fallback: boolean): [boolean, (v: boolean) => void] {
  const [v, setV] = useState<boolean>(() => readLS(key, fallback ? '1' : '0') === '1');
  const set = (next: boolean) => { setV(next); try { localStorage.setItem(key, next ? '1' : '0'); } catch { /* ignore */ } };
  return [v, set];
}

const SECTIONS = ['General', 'Account', 'API Keys', 'Notifications', 'Privacy'];
const SECTION_ICON: Record<string, ReactNode> = {
  General: sic('M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 13a7.9 7.9 0 000-2l2-1.5-2-3.4-2.3 1a8 8 0 00-1.7-1L14.9 3H9.1l-.5 2.6a8 8 0 00-1.7 1l-2.3-1-2 3.4L4.6 11a7.9 7.9 0 000 2l-2 1.5 2 3.4 2.3-1a8 8 0 001.7 1l.5 2.6h5.8l.5-2.6a8 8 0 001.7-1l2.3 1 2-3.4z'),
  Account: sic('M12 12a4 4 0 100-8 4 4 0 000 8zM5 20c0-3.3 3.1-6 7-6s7 2.7 7 6'),
  'API Keys': sic('M15 7a4 4 0 11-4 4M7 15l-4 4M10 12l-3 3M13 9l6-6'),
  Notifications: sic('M6 8a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 004 0'),
  Privacy: sic('M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z'),
};

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={['inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors', on ? 'justify-end bg-brand' : 'justify-start bg-wire-border'].join(' ')}>
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

function TextField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-wire-muted">{label}</p>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 w-full rounded-md border border-wire-border bg-wire-bg px-3 text-sm text-wire-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
    </div>
  );
}

function Saved() {
  return <span className="ml-2 text-[11px] text-ok">Saved automatically</span>;
}

function General() {
  const [theme, setTheme] = useLS('ovarly.theme', 'System');
  const [model, setModel] = useLS('ovarly.defaultModel', 'ECOM_SHOOT');
  return (
    <div className="space-y-5">
      <Card title="Appearance" desc="Your preference is saved on this device.">
        <div className="inline-flex rounded-md border border-wire-border bg-wire-bg p-0.5">
          {['Light', 'Dark', 'System'].map((m) => (
            <button key={m} type="button" onClick={() => setTheme(m)} className={['rounded px-4 py-1.5 text-sm font-medium transition-colors', m === theme ? 'bg-brand text-white shadow-card' : 'text-wire-muted hover:text-wire-text'].join(' ')}>{m}</button>
          ))}
        </div>
      </Card>
      <Card title="Default shoot model" desc="Used as the starting model for new projects.">
        <div className="flex flex-wrap gap-2">
          {['ECOM_SHOOT', 'LIFESTYLE_SHOOT', 'CREATIVE_SHOOT', 'EDITORIAL_HIGH_FASHION'].map((m) => (
            <button key={m} type="button" onClick={() => setModel(m)} className={['rounded-md border px-3 py-1.5 text-xs font-medium', m === model ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border text-wire-muted hover:text-wire-text'].join(' ')}>{m.replace(/_/g, ' ').toLowerCase()}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Account() {
  const [name, setName] = useLS('ovarly.profile.name', '');
  const [email, setEmail] = useLS('ovarly.profile.email', '');
  return (
    <div className="space-y-5">
      <Card title="Profile" desc="Stored locally on this device.">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Full name" value={name} onChange={setName} placeholder="Your name" />
          <TextField label="Email" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
        </div>
        <p className="mt-3 text-xs text-wire-muted">Profiles &amp; sign-in arrive with authentication in a later update.<Saved /></p>
      </Card>
    </div>
  );
}

function ApiKeys() {
  const [gemini, setGemini] = useLS('gemini_api_key', '');
  const [kie, setKie] = useLS('kie_api_key', '');
  return (
    <div className="space-y-5">
      <Card title="Gemini API key" desc="Used by the Generation Canvas to create images. Stored only in this browser.">
        <TextField label="Google Gemini" value={gemini} onChange={setGemini} placeholder="AIza…" type="password" />
        <p className="mt-2 flex items-center gap-2 text-xs">{gemini ? <Pill tone="ok">Key set</Pill> : <Pill tone="warn">Not set</Pill>}<Saved /></p>
      </Card>
      <Card title="Kie.ai API key" desc="Optional alternate image provider (requires S3 setup).">
        <TextField label="Kie.ai" value={kie} onChange={setKie} placeholder="sk-…" type="password" />
        <p className="mt-2 flex items-center gap-2 text-xs">{kie ? <Pill tone="ok">Key set</Pill> : <Pill tone="neutral">Not set</Pill>}<Saved /></p>
      </Card>
    </div>
  );
}

function ToggleRow({ label, title, desc, fallback }: { label: string; title: string; desc: string; fallback: boolean }) {
  const [on, setOn] = useBoolLS(label, fallback);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div><p className="text-sm font-medium text-wire-text">{title}</p><p className="text-xs text-wire-muted">{desc}</p></div>
      <Switch on={on} onChange={setOn} />
    </div>
  );
}

function NotificationsSection() {
  return (
    <Card title="Notifications" desc="Choose what you're notified about. Saved on this device.">
      <div className="divide-y divide-wire-border">
        <ToggleRow label="ovarly.notif.genComplete" title="Generation complete" desc="When a batch finishes generating." fallback />
        <ToggleRow label="ovarly.notif.lowCredits" title="Low credits" desc="When your balance runs low." fallback />
        <ToggleRow label="ovarly.notif.updates" title="Product updates" desc="New features and announcements." fallback={false} />
      </div>
    </Card>
  );
}

function Privacy() {
  return (
    <div className="space-y-5">
      <Card title="Data & privacy" desc="Control how your data is used. Saved on this device.">
        <div className="divide-y divide-wire-border">
          <ToggleRow label="ovarly.privacy.analytics" title="Usage analytics" desc="Help improve OVARLY with anonymous usage data." fallback />
          <ToggleRow label="ovarly.privacy.marketing" title="Marketing emails" desc="Occasional product news and offers." fallback={false} />
        </div>
      </Card>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [section, setSection] = useState('General');
  const [query, setQuery] = useState('');
  const shown = SECTIONS.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()));

  // Keep the runtime Gemini client in sync if the key was changed here.
  useEffect(() => {
    const k = readLS('gemini_api_key', '');
    if (k) import('../../services/geminiService').then((m) => m.setGeminiApiKey(k)).catch(() => {});
  }, [section]);

  return (
    <div className="mx-auto flex max-w-6xl gap-6">
      <aside className="w-60 shrink-0">
        <label className="mb-3 flex h-9 items-center gap-2 rounded-md border border-wire-border bg-wire-surface px-3 focus-within:border-brand">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted" placeholder="Search" />
        </label>
        <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-wire-faint">Settings</p>
        <ul className="space-y-1">
          {shown.length === 0 ? <li className="px-2.5 py-2 text-xs text-wire-faint">No matching settings</li> : null}
          {shown.map((s) => (
            <li key={s}>
              <button type="button" onClick={() => setSection(s)} className={['flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors', s === section ? 'bg-brand-weak font-semibold text-brand' : 'font-medium text-wire-muted hover:bg-wire-bg hover:text-wire-text'].join(' ')}>
                <span className="grid place-items-center">{SECTION_ICON[s]}</span>{s}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-wire-border pt-2">
          <button type="button" onClick={() => navigate(ROUTES.billing)} className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-wire-muted transition-colors hover:bg-wire-bg hover:text-wire-text">
            <span className="grid place-items-center">{sic('M3 6h18v12H3zM3 10h18M7 15h4')}</span>
            Billing
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="ml-auto text-wire-faint" aria-hidden><path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <h2 className="mb-4 text-xl font-semibold text-wire-text">{section}</h2>
        {section === 'General' ? <General /> : null}
        {section === 'Account' ? <Account /> : null}
        {section === 'API Keys' ? <ApiKeys /> : null}
        {section === 'Notifications' ? <NotificationsSection /> : null}
        {section === 'Privacy' ? <Privacy /> : null}
      </div>
    </div>
  );
}
