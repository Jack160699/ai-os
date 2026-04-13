export function EmptyState({ title, description, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-dashed border-white/[0.09] bg-white/[0.018] px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${className}`}
      role="status"
    >
      <p className="text-sm font-medium tracking-tight text-slate-200">{title}</p>
      {description ? <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{description}</p> : null}
    </div>
  );
}
