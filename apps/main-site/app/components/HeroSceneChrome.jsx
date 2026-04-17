/** Right-column live scene chrome — motion reads against the canvas field. */
export function HeroSceneChrome() {
  const bars = [38, 62, 44, 78, 52, 88, 41, 70, 55];
  return (
    <div className="relative flex w-full max-w-[420px] flex-col gap-6 lg:max-w-none" aria-hidden>
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[radial-gradient(ellipse_at_50%_30%,rgba(56,189,248,0.12),transparent_62%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[rgba(4,8,18,0.45)] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_48px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Operating graph
            </span>
          </div>
          <span className="font-mono text-[10px] tabular-nums tracking-tight text-zinc-500">LIVE</span>
        </div>
        <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="flex h-[120px] items-end justify-between gap-1.5 px-0.5">
          {bars.map((pct, i) => (
            <div
              key={i}
              className="sx-hero-metric-bar flex-1 rounded-t-[3px] bg-gradient-to-t from-sky-600/25 via-sky-400/50 to-sky-100/90 shadow-[0_0_16px_-4px_rgba(56,189,248,0.35)]"
              style={{
                height: `${pct}%`,
                animationDelay: `${i * 0.11}s`,
              }}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-between font-mono text-[9px] uppercase tracking-wider text-zinc-600">
          <span>Signal</span>
          <span>Flow</span>
          <span>Load</span>
        </div>
      </div>
      <p className="max-w-sm text-[13px] leading-relaxed text-zinc-500">
        Real-time topology mapped to how serious teams run — bottlenecks, handoffs, and execution pressure visible at a
        glance.
      </p>
    </div>
  );
}
