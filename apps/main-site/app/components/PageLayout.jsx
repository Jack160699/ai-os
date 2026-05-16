/** Shared inner-page shell — warm light design system. */
export function PageLayout({ title, eyebrow, children }) {
  return (
    <div className="relative border-b border-stone-200/80 bg-[var(--sx-surface)]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{title}</h1>
        <div className="mt-8 text-[15px] leading-relaxed text-stone-600">{children}</div>
      </div>
    </div>
  );
}
