export function PremiumCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.02] transition hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(0,0,0,0.24)] ${className}`}
    >
      {(title || subtitle || action) ? (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-sm font-semibold tracking-tight text-[var(--v2-text)]">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-xs text-[var(--v2-muted)]">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
