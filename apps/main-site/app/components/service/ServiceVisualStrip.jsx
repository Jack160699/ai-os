/** CSS-only “device / UI” placeholders — no stock imagery. */
export function ServiceVisualStrip({ captions = ["", "", ""] }) {
  const [a, b, c] = captions;
  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      <figure className="flex flex-col gap-2">
        <div
          className="relative mx-auto aspect-[9/19] w-[min(100%,11rem)] rounded-[1.35rem] border border-stone-200/90 bg-gradient-to-b from-white to-stone-100/90 p-2 shadow-[var(--sx-shadow-sm)]"
          aria-hidden
        >
          <div className="mx-auto h-1 w-8 rounded-full bg-stone-300/80" />
          <div className="mt-3 space-y-2 px-1">
            <div className="h-2 w-[72%] rounded-full bg-stone-200" />
            <div className="h-2 w-[55%] rounded-full bg-stone-200/90" />
            <div className="mt-4 h-16 rounded-lg bg-[color-mix(in_srgb,var(--sx-green-mid)_12%,white)]" />
            <div className="mt-2 h-8 rounded-md bg-stone-200/80" />
          </div>
        </div>
        <figcaption className="text-center text-[11px] leading-snug text-stone-500">{a}</figcaption>
      </figure>
      <figure className="flex flex-col gap-2">
        <div
          className="relative aspect-[16/10] w-full rounded-xl border border-stone-200/90 bg-gradient-to-br from-white to-stone-100/85 p-3 shadow-[var(--sx-shadow-sm)]"
          aria-hidden
        >
          <div className="flex gap-1 border-b border-stone-200/70 pb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="col-span-2 h-20 rounded-lg bg-stone-200/55" />
            <div className="space-y-1.5">
              <div className="h-2 rounded bg-stone-200" />
              <div className="h-2 rounded bg-stone-200/90" />
              <div className="h-2 rounded bg-stone-200/80" />
            </div>
          </div>
        </div>
        <figcaption className="text-center text-[11px] leading-snug text-stone-500">{b}</figcaption>
      </figure>
      <figure className="flex flex-col gap-2">
        <div
          className="relative flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-stone-300/90 bg-stone-50/80 p-4 shadow-[var(--sx-shadow-sm)]"
          aria-hidden
        >
          <div className="flex items-center gap-2 text-stone-400">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--sx-green-mid)]/35" />
            <span className="h-px w-10 bg-stone-300" />
            <span className="h-2.5 w-2.5 rounded-full border border-stone-300 bg-white" />
            <span className="h-px w-10 bg-stone-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300/80" />
          </div>
        </div>
        <figcaption className="text-center text-[11px] leading-snug text-stone-500">{c}</figcaption>
      </figure>
    </div>
  );
}
