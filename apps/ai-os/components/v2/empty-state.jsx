export function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-[#94a3b8]">{description}</p>
    </div>
  );
}
