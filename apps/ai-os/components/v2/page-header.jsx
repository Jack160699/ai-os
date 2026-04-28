export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.65rem]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--v2-muted)]">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
