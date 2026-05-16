/** Shared inner-page shell — glass panel on warm canvas. */
export function PageLayout({ title, eyebrow, children, wideForm = false }) {
  const innerMax = wideForm ? "max-w-4xl" : "max-w-3xl";
  const glassPad = wideForm ? "px-5 py-8 sm:px-9 sm:py-10" : "px-5 py-8 sm:px-8 sm:py-10";

  return (
    <div className="relative border-b border-stone-200/60">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-[var(--sx-canvas-mid)]/40"
        aria-hidden
      />
      <div className={`relative mx-auto w-full ${innerMax} px-4 py-14 sm:px-6 sm:py-20`}>
        <div className={`sx-glass-page ${glassPad}`}>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[var(--sx-ink)] sm:text-4xl">{title}</h1>
          <div
            className={`mt-6 text-[15px] leading-relaxed text-[color:var(--sx-ink-secondary)] sm:mt-8 ${wideForm ? "max-w-none" : ""}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
