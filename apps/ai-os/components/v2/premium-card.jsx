export function PremiumCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-[#0b1220] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.25)] ${className}`}>
      {(title || subtitle || action) ? (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-sm font-semibold text-white">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-xs text-[#94a3b8]">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
