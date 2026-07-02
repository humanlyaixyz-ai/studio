import type { ReactNode, ButtonHTMLAttributes } from 'react';

/* Shared hi-fi primitives — the colored counterparts of the wireframe's
   Wire* components. Reused across all OVARLY screens. */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-brand text-white border border-brand hover:bg-brand-hover',
  secondary: 'bg-wire-surface text-wire-text border border-wire-border hover:bg-wire-bg hover:border-wire-border-strong',
  ghost: 'bg-transparent text-wire-muted border border-transparent hover:bg-wire-bg hover:text-wire-text',
  danger: 'bg-wire-surface text-danger border border-wire-border hover:bg-danger-weak',
};

export function Button({
  children, variant = 'primary', size = 'md', className = '', ...rest
}: { children: ReactNode; variant?: BtnVariant; size?: 'sm' | 'md' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type="button"
      className={['inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none', pad, BTN[variant], className].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' }) {
  const tones = {
    neutral: 'border-wire-border text-wire-muted bg-wire-surface',
    brand: 'border-brand-weak-2 text-brand bg-brand-weak',
    ok: 'border-transparent text-ok bg-ok-weak',
    warn: 'border-transparent text-warn bg-warn-weak',
    danger: 'border-transparent text-danger bg-danger-weak',
  } as const;
  return <span className={['inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', tones[tone]].join(' ')}>{children}</span>;
}

export function SectionLabel({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-wire-muted">{children}</p>
      {action}
    </div>
  );
}

export function Card({ children, className = '', dashed = false, hover = false }: { children: ReactNode; className?: string; dashed?: boolean; hover?: boolean }) {
  return (
    <div className={[
      'rounded-lg bg-wire-surface',
      dashed ? 'border border-dashed border-wire-border' : 'border border-wire-border',
      hover ? 'transition-all hover:border-wire-border-strong hover:shadow-card' : '',
      className,
    ].join(' ')}>
      {children}
    </div>
  );
}
