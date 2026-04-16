"use client";

/** Premium dashboard silhouette — no raster assets. */
export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none">
      <div
        className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.18)] ring-1 ring-zinc-100"
        aria-hidden
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
          </div>
          <div className="h-2 w-24 rounded-full bg-zinc-100" />
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {["68%", "82%", "54%"].map((w, i) => (
            <div key={i} className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
              <div className="mb-2 h-2 w-10 rounded-full bg-zinc-200" />
              <div className="h-1.5 rounded-full bg-zinc-100" style={{ width: w }} />
              <div className="mt-3 h-10 rounded-md bg-zinc-100" />
            </div>
          ))}
        </div>
        <div className="space-y-2 rounded-xl bg-zinc-50/80 p-3 ring-1 ring-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/15" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-2 w-[62%] rounded-full bg-zinc-200" />
              <div className="h-1.5 w-[88%] rounded-full bg-zinc-100" />
            </div>
            <div className="hidden h-2 w-10 rounded-full bg-emerald-100 sm:block" />
          </div>
          <div className="flex items-center gap-3 opacity-80">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-200/80" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-2 w-[48%] rounded-full bg-zinc-200" />
              <div className="h-1.5 w-[72%] rounded-full bg-zinc-100" />
            </div>
          </div>
          <div className="flex items-center gap-3 opacity-60">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-200/60" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-2 w-[40%] rounded-full bg-zinc-200" />
              <div className="h-1.5 w-[64%] rounded-full bg-zinc-100" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 flex-1 rounded-lg bg-[var(--sx-navy)]" />
          <div className="h-8 w-20 rounded-lg bg-zinc-100 ring-1 ring-zinc-200" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute -right-4 -bottom-6 -z-10 h-40 w-40 rounded-full bg-blue-500/[0.07] blur-2xl sm:h-48 sm:w-48"
        aria-hidden
      />
    </div>
  );
}
