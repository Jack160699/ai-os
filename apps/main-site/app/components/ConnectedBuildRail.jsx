import { Fragment } from "react";

/**
 * Operational modules as one connected system — not a card grid.
 */
export function ConnectedBuildRail({ className = "" }) {
  const modules = ["Leads", "Automation", "Execution", "Tracking"];
  return (
    <div
      className={[
        "mt-8 flex w-full max-w-md flex-col gap-0 sm:max-w-none lg:max-w-4xl lg:flex-row lg:items-stretch",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      {modules.map((label, i) => (
        <Fragment key={label}>
          <div
            className={[
              "relative w-full rounded-xl border border-white/[0.09] bg-[#0B0F19]/55 px-4 py-3.5 text-center backdrop-blur-md",
              "shadow-[0_0_0_1px_rgba(0,0,0,0.5)_inset] transition-[border-color,box-shadow,transform] duration-[650ms] ease-out",
              "hover:-translate-y-0.5 hover:border-sky-500/18 hover:shadow-[0_0_36px_-18px_rgba(59,130,246,0.2)]",
              "lg:min-w-0 lg:flex-1",
            ].join(" ")}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-zinc-400">{label}</p>
          </div>
          {i < modules.length - 1 ? (
            <>
              <div className="flex justify-center py-2 lg:hidden" aria-hidden>
                <span className="text-[11px] font-medium tracking-[0.18em] text-zinc-600">—</span>
              </div>
              <div className="hidden w-10 shrink-0 items-center justify-center gap-1 lg:flex" aria-hidden>
                <span className="h-px w-4 bg-gradient-to-r from-transparent to-white/12" />
                <span className="text-[10px] font-medium text-zinc-600">—</span>
                <span className="h-px w-4 bg-gradient-to-l from-transparent to-white/12" />
              </div>
            </>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
