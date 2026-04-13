export function EmptyState({ title, description, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015] px-6 py-10 text-center ${className}`}
      role="status"
    >
      <p className="text-sm font-medium tracking-tight text-slate-200">{title}</p>
      {description ? <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p> : null}
    </div>
  );
}
