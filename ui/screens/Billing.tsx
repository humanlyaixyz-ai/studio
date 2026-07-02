import { useState } from 'react';
import { Button, Pill } from '../kit';

/**
 * Billing — hi-fi build of BillingWireframe.
 * Credit system with two tabs:
 *  - Plans & credits: current plan + 3 plans, payment method, invoices, cancellation, top-up modal.
 *  - Usage: credit utilisation + image-generation analytics, filterable by time + model.
 * All figures are PLACEHOLDER. Shell (sidebar + header) is provided by AppShell.
 */

// Credits scale up faster than price -> bigger plan = lower cost per credit.
const PLANS = [
  { name: 'Starter', monthly: 19, annual: 15, credits: '2,000', per1k: '$9.50', note: 'For trying things out', features: ['2,000 credits / month', '1 workspace', 'Standard image models', 'Email support'], cta: 'Choose Starter', current: false, badge: '', value: '' },
  { name: 'Studio', monthly: 49, annual: 39, credits: '12,000', per1k: '$4.08', note: 'For regular production', features: ['12,000 credits / month', 'Up to 5 workspaces', 'All image models', 'Priority support'], cta: 'Current plan', current: true, badge: 'Most popular', value: '~57% cheaper per credit than Starter' },
  { name: 'Scale', monthly: 149, annual: 119, credits: '50,000', per1k: '$2.98', note: 'For teams at volume', features: ['50,000 credits / month', 'Unlimited workspaces', 'All image models', 'Dedicated support'], cta: 'Upgrade', current: false, badge: 'Best value', value: '~27% cheaper per credit than Studio' },
];

const PAYMENT = { brand: 'Visa', last4: '4242', expires: '08 / 27' };

const INVOICES = [
  { date: 'Jun 14, 2026', total: 'US$49', status: 'Paid' },
  { date: 'Jun 8, 2026', total: 'US$49', status: 'Refunded' },
  { date: 'May 8, 2026', total: 'US$49', status: 'Paid' },
  { date: 'Apr 8, 2026', total: 'US$49', status: 'Paid' },
  { date: 'Mar 28, 2026', total: 'US$49', status: 'Refunded' },
  { date: 'Feb 28, 2026', total: 'US$49', status: 'Paid' },
];

// One-off top-ups — bigger top-up = bigger bonus (5% -> 20%). Base ~200 credits / $.
const TOPUPS = [
  { amount: 10, base: '2,000', credits: '2,100', bonus: '+5%' },
  { amount: 25, base: '5,000', credits: '5,500', bonus: '+10%' },
  { amount: 50, base: '10,000', credits: '11,500', bonus: '+15%', popular: true },
  { amount: 100, base: '20,000', credits: '24,000', bonus: '+20%' },
];

const RANGES = ['7 days', '30 days', '90 days'];

const KPIS = [
  { label: 'Credits used', value: '8,200', sub: 'this period' },
  { label: 'Images generated', value: '1,025', sub: 'this period' },
  { label: 'Avg credits / image', value: '8.0', sub: 'across models' },
  { label: 'Regenerations', value: '142', sub: '14% of images' },
];

// usage-over-time (relative bar heights)
const BARS = [40, 55, 30, 70, 50, 85, 60, 45, 75, 65, 90, 50, 35, 80];

const BY_MODEL = [
  { model: 'Krea 2 Large', images: 540, credits: '4,320', avg: '8.0' },
  { model: 'Nano Banana 2', images: 280, credits: '1,680', avg: '6.0' },
  { model: 'GPT Image 2', images: 130, credits: '1,300', avg: '10.0' },
  { model: 'Seedream 5 Lite', images: 75, credits: '300', avg: '4.0' },
];

const chevron = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-muted" aria-hidden><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={['-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors', active ? 'border-brand text-brand' : 'border-transparent text-wire-muted hover:text-wire-text'].join(' ')}
    >
      {label}
    </button>
  );
}

function PlansTab() {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [topUp, setTopUp] = useState(false);
  const [pack, setPack] = useState(50); // selected top-up amount
  const annual = cycle === 'annual';
  return (
    <div className="space-y-8">
      {/* current plan + balance */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-wire-muted">Current plan</p>
          <p className="text-lg font-semibold text-wire-text">Studio · $49 / month</p>
          <p className="mt-0.5 text-xs text-wire-muted">8,200 used · 1,800 credits left · resets in 12 days</p>
        </div>
        <div className="w-64">
          <div className="h-2 w-full overflow-hidden rounded-full bg-wire-border">
            <div className="h-full rounded-full bg-brand" style={{ width: '82%' }} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setTopUp(true)}>Buy more credits</Button>
            <Button variant="secondary" size="sm">Manage plan</Button>
          </div>
        </div>
      </div>

      {/* plans */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-wire-text">Plans</p>
          <span className="text-xs text-wire-muted">Placeholder pricing — final data later</span>
        </div>

        {/* billing cycle toggle */}
        <div className="mb-4 flex items-center gap-3">
          <div className="inline-flex rounded-md border border-wire-border bg-wire-bg p-0.5">
            {(['monthly', 'annual'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={['rounded px-4 py-1.5 text-sm font-medium capitalize transition-colors', cycle === c ? 'bg-brand text-white shadow-card' : 'text-wire-muted'].join(' ')}
              >
                {c}
              </button>
            ))}
          </div>
          <Pill tone="ok">Save 20% annually</Pill>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const price = annual ? p.annual : p.monthly;
            const highlight = p.badge === 'Best value' || p.current;
            return (
              <div key={p.name} className={['relative flex flex-col rounded-lg border bg-wire-surface p-5 shadow-card', highlight ? 'border-brand ring-1 ring-brand-weak-2' : 'border-wire-border'].join(' ')}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-wire-text">{p.name}</p>
                  {p.badge ? <Pill tone="brand">{p.badge}</Pill> : null}
                </div>
                <p className="mt-2 text-2xl font-semibold text-wire-text">${price}<span className="text-sm font-normal text-wire-muted"> / mo</span></p>
                <p className="mt-0.5 text-xs text-wire-muted">{annual ? `Billed annually · $${price * 12}/yr` : p.note}</p>
                <p className="mt-3 text-sm font-medium text-wire-text">{p.credits} credits / month</p>
                {/* value framing — why a larger plan is worth it */}
                <p className="mt-1 text-xs text-wire-muted">≈ {p.per1k} / 1,000 credits</p>
                {p.value ? (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-ok">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                    {p.value}
                  </p>
                ) : null}
                <ul className="mt-3 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-wire-muted">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {p.current ? (
                    <Button variant="secondary" size="md" disabled className="w-full">{p.cta}</Button>
                  ) : (
                    <Button size="md" className="w-full">{p.cta}</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* payment method */}
      <div>
        <p className="mb-3 text-sm font-semibold text-wire-text">Payment method</p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-12 items-center justify-center rounded border border-brand-weak-2 bg-brand-weak text-[10px] font-semibold text-brand">{PAYMENT.brand}</div>
            <div>
              <p className="text-sm font-medium text-wire-text">{PAYMENT.brand} ending in {PAYMENT.last4}</p>
              <p className="text-xs text-wire-muted">Expires {PAYMENT.expires}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">Update</Button>
            <Button variant="ghost" size="sm">Add payment method</Button>
          </div>
        </div>
      </div>

      {/* invoices */}
      <div>
        <p className="mb-3 text-sm font-semibold text-wire-text">Invoices</p>
        <div className="overflow-hidden rounded-lg border border-wire-border bg-wire-surface shadow-card">
          <div className="flex items-center bg-wire-bg px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-wire-muted">
            <span className="flex-1">Date</span>
            <span className="w-40">Total</span>
            <span className="w-32">Status</span>
            <span className="w-20 text-right">Actions</span>
          </div>
          {INVOICES.map((inv, i) => (
            <div key={i} className={['flex items-center px-4 py-3 text-sm', i > 0 ? 'border-t border-wire-border' : ''].join(' ')}>
              <span className="flex-1 text-wire-text">{inv.date}</span>
              <span className="flex w-40 items-center gap-1.5 text-wire-text">
                {inv.total}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" /></svg>
              </span>
              <span className="w-32">
                {inv.status === 'Paid' ? <Pill tone="ok">Paid</Pill> : <Pill tone="neutral">Refunded</Pill>}
              </span>
              <span className="w-20 text-right"><button type="button" className="text-sm font-medium text-brand hover:underline">View</button></span>
            </div>
          ))}
        </div>
      </div>

      {/* cancellation */}
      <div>
        <p className="mb-3 text-sm font-semibold text-wire-text">Cancellation</p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
          <div>
            <p className="text-sm font-medium text-wire-text">Cancel plan</p>
            <p className="text-xs text-wire-muted">You keep your remaining credits until the end of the current billing period.</p>
          </div>
          <Button variant="danger" size="md">Cancel plan</Button>
        </div>
      </div>

      {/* Top-up modal — preset packs (bigger = more bonus, 5%->20%) + custom amount */}
      {topUp ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(24,24,27,0.45)' }}>
          <div className="w-full max-w-xl rounded-xl border border-wire-border bg-wire-surface shadow-pop">
            <div className="flex items-start justify-between border-b border-wire-border px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-wire-text">Top up credits</h3>
                <p className="mt-0.5 text-xs text-wire-muted">Add credits any time. Bigger top-ups earn more bonus.</p>
              </div>
              <button type="button" onClick={() => setTopUp(false)} aria-label="Close" className="text-wire-muted hover:text-wire-text">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                {TOPUPS.map((t) => (
                  <button
                    key={t.amount}
                    type="button"
                    onClick={() => setPack(t.amount)}
                    className={['rounded-lg border p-4 text-left transition-colors', pack === t.amount ? 'border-brand bg-brand-weak ring-1 ring-brand' : 'border-wire-border hover:border-wire-border-strong'].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-wire-text">${t.amount}</span>
                      <Pill tone="ok">{t.bonus} bonus</Pill>
                    </div>
                    <p className="mt-1 text-sm text-wire-text">{t.credits} credits</p>
                    <p className="text-[11px] text-wire-muted">{t.base} + {t.bonus} bonus</p>
                  </button>
                ))}
              </div>
              {/* custom amount */}
              <div className="rounded-lg border border-dashed border-wire-border p-4">
                <p className="text-sm font-medium text-wire-text">Custom amount</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 w-32 items-center gap-1 rounded-md border border-wire-border bg-wire-surface px-3 text-sm text-wire-muted">
                    <span className="text-wire-text">$</span> e.g. 75
                  </div>
                  <span className="text-xs text-wire-muted">≈ 15,000 credits · bonus scales with amount (5%–20%)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-wire-border px-5 py-4">
              <span className="text-xs text-wire-muted">Placeholder pricing — final data later</span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="md" onClick={() => setTopUp(false)}>Cancel</Button>
                <Button size="md" onClick={() => setTopUp(false)}>Top up ${pack}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UsageTab() {
  const [range, setRange] = useState('30 days');
  const model = 'All models'; // model filter is static in the wireframe
  return (
    <div className="space-y-6">
      {/* filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-wire-muted">Time</span>
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={['rounded-full border px-3 py-1 text-xs font-medium transition-colors', range === r ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong'].join(' ')}
            >
              {r}
            </button>
          ))}
          <span className="flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-wire-border px-3 py-1 text-xs text-wire-muted">Custom {chevron}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-wire-muted">Model</span>
          <div className="flex h-8 w-48 cursor-pointer items-center justify-between rounded-md border border-wire-border bg-wire-surface px-3 text-sm text-wire-text hover:border-wire-border-strong">
            {model} {chevron}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-lg border border-wire-border bg-wire-surface p-4 shadow-card">
            <p className="text-xs text-wire-muted">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold text-wire-text">{k.value}</p>
            <p className="mt-0.5 text-[11px] text-wire-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* usage over time */}
      <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-wire-text">Credits used over time</p>
          <span className="text-xs text-wire-muted">Last {range} · {model}</span>
        </div>
        <div className="flex h-40 items-end gap-2">
          {BARS.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-brand-weak transition-colors hover:bg-brand" style={{ height: `${h}%` }} aria-hidden />
          ))}
        </div>
      </div>

      {/* by model */}
      <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <p className="mb-3 text-sm font-semibold text-wire-text">Usage by model</p>
        <div className="overflow-hidden rounded-md border border-wire-border">
          <div className="flex items-center bg-wire-bg px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-wire-muted">
            <span className="flex-1">Model</span>
            <span className="w-28 text-right">Images</span>
            <span className="w-28 text-right">Credits</span>
            <span className="w-32 text-right">Avg / image</span>
          </div>
          {BY_MODEL.map((m, i) => (
            <div key={m.model} className={['flex items-center px-4 py-3 text-sm', i > 0 ? 'border-t border-wire-border' : ''].join(' ')}>
              <span className="flex-1 font-medium text-wire-text">{m.model}</span>
              <span className="w-28 text-right text-wire-text">{m.images}</span>
              <span className="w-28 text-right text-wire-text">{m.credits}</span>
              <span className="w-32 text-right text-wire-muted">{m.avg}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-wire-muted">Placeholder figures — final data later.</p>
      </div>
    </div>
  );
}

export default function Billing() {
  const [tab, setTab] = useState<'plans' | 'usage'>('plans');
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Billing</h2>
        <p className="mt-1 text-sm text-wire-muted">Credits power image generation. Manage your plan and track how credits are used.</p>
      </div>

      <div className="flex items-center gap-1 border-b border-wire-border">
        <Tab label="Plans & credits" active={tab === 'plans'} onClick={() => setTab('plans')} />
        <Tab label="Usage" active={tab === 'usage'} onClick={() => setTab('usage')} />
      </div>

      {tab === 'plans' ? <PlansTab /> : <UsageTab />}
    </div>
  );
}
