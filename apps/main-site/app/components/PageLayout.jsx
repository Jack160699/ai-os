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
          {eyebrow ? <p className="sx-type-eyebrow">{eyebrow}</p> : null}
          <h1 className={`sx-type-display ${eyebrow ? "mt-2" : ""}`}>{title}</h1>
          <div
            className={`sx-type-body mt-6 sm:mt-8 ${wideForm ? "max-w-none" : ""} [&_a]:font-medium [&_a]:text-[var(--sx-ink)] [&_a]:underline [&_a]:decoration-stone-300/80 [&_a]:underline-offset-[5px] [&_a]:transition-colors [&_a]:hover:decoration-stone-400`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
