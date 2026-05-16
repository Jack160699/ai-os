import { Fragment } from "react";

/**
 * Operational modules as one connected system — not a card grid.
 */
export function ConnectedBuildRail({ className = "", modules = ["Leads", "Automation", "Execution", "Tracking"] }) {
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
              "relative w-full rounded-xl border border-stone-200/90 bg-white/95 px-4 py-3.5 text-center shadow-sm",
              "transition-[border-color,box-shadow,transform] duration-[650ms] ease-out",
              "hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md",
              "lg:min-w-0 lg:flex-1",
            ].join(" ")}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-stone-500">{label}</p>
          </div>
          {i < modules.length - 1 ? (
            <>
              <div className="flex justify-center py-2 lg:hidden" aria-hidden>
                <span className="text-[11px] font-medium tracking-[0.18em] text-stone-400">—</span>
              </div>
              <div className="hidden w-10 shrink-0 items-center justify-center gap-1 lg:flex" aria-hidden>
                <span className="h-px w-4 bg-gradient-to-r from-transparent to-stone-300/80" />
                <span className="text-[10px] font-medium text-stone-400">—</span>
                <span className="h-px w-4 bg-gradient-to-l from-transparent to-stone-300/80" />
              </div>
            </>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
