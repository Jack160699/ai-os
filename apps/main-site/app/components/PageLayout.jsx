/** Shared inner-page shell — matches homepage design system. */
export function PageLayout({ title, eyebrow, children }) {
  return (
    <div className="border-b border-zinc-100 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-4xl">{title}</h1>
        <div className="mt-8 text-[15px] leading-relaxed text-zinc-600">{children}</div>
      </div>
    </div>
  );
}
