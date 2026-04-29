export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--v2-text)] md:text-[1.7rem]">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-[var(--v2-muted)]">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
