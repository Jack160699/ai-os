/** Premium abstract systems dashboard — SVG only, no external assets. */
export function HeroDashboardVisual() {
  return (
    <div
      className="sx-hero-float relative mx-auto w-full max-w-[min(100%,420px)] lg:max-w-none"
      aria-hidden
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[5/6] lg:aspect-square">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#141c2e] via-[#0e1524] to-[#080c14] p-px shadow-[0_2px_0_rgba(255,255,255,0.04)_inset,0_28px_56px_-16px_rgba(12,18,34,0.55),0_12px_28px_-12px_rgba(12,18,34,0.35)] ring-1 ring-white/[0.08]">
          <div className="flex h-full flex-col overflow-hidden rounded-[15px] bg-[#0c1222] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-24px_48px_-32px_rgba(0,0,0,0.45)]">
            {/* Window chrome */}
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-transparent px-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
              </div>
              <div className="ml-2 h-5 flex-1 max-w-[140px] rounded-md bg-white/[0.05]" />
            </div>
            <div className="flex flex-1 gap-2 p-2.5 sm:p-3">
              {/* Sidebar */}
              <div className="hidden w-[18%] shrink-0 flex-col gap-1.5 sm:flex">
                {[0.12, 0.08, 0.06, 0.07, 0.05].map((o, i) => (
                  <div key={i} className="h-2 rounded-sm bg-white" style={{ opacity: o }} />
                ))}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* Metric row */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[
                    ["Pipeline", "94%"],
                    ["SLA", "2.4h"],
                    ["Owners", "12"],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_6px_-2px_rgba(0,0,0,0.35)] sm:px-2.5 sm:py-2"
                    >
                      <div className="text-[8px] font-medium uppercase tracking-wider text-white/40 sm:text-[9px]">
                        {label}
                      </div>
                      <div className="mt-0.5 text-[11px] font-semibold tabular-nums text-white/90 sm:text-xs">
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Chart area */}
                <div className="relative flex-1 min-h-[88px] rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.055] via-white/[0.02] to-transparent p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_-4px_rgba(0,0,0,0.4)] sm:min-h-[100px]">
                  <svg className="h-full w-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sx-hero-chart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(96 165 250)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="rgb(96 165 250)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 58 L28 52 L52 60 L78 38 L102 44 L128 22 L154 30 L178 18 L200 26 L200 80 L0 80 Z"
                      fill="url(#sx-hero-chart)"
                    />
                    <path
                      d="M0 58 L28 52 L52 60 L78 38 L102 44 L128 22 L154 30 L178 18 L200 26"
                      fill="none"
                      stroke="rgb(147 197 253)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.85"
                    />
                  </svg>
                  <div className="absolute bottom-1.5 left-2 right-2 flex justify-between text-[7px] font-medium uppercase tracking-wide text-white/30 sm:text-[8px]">
                    <span>Q1</span>
                    <span>Q2</span>
                    <span>Q3</span>
                    <span>Q4</span>
                  </div>
                </div>
                {/* Flow strip */}
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_8px_-4px_rgba(0,0,0,0.35)]">
                  {["Intake", "Route", "Execute", "Review"].map((step, i) => (
                    <div key={step} className="flex min-w-0 flex-1 items-center gap-1">
                      <span className="truncate text-[8px] font-medium text-white/45 sm:text-[9px]">{step}</span>
                      {i < 3 ? (
                        <span className="text-white/15" aria-hidden>
                          →
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Soft glow */}
        <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[36px] bg-[radial-gradient(ellipse_at_50%_40%,rgba(37,99,235,0.14),rgba(12,18,34,0.06)_45%,transparent_70%)] blur-2xl" />
      </div>
    </div>
  );
}
