import Link from "next/link";

/** Icon + wordmark — `tone="hero"` for the light marketing site. `compact` reduces visual weight in headers. */
export function StratxcelBrand({ className = "", tone = "default", compact = false }) {
  const onHero = tone === "hero";
  const iconShell = compact
    ? "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] transition-[background-color,box-shadow] duration-200 ease-out group-hover:bg-white"
    : "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-[1.02] group-active:scale-[0.98]";
  const iconClasses = [
    iconShell,
    onHero
      ? compact
        ? "bg-stone-100/90 ring-1 ring-stone-200/80 group-hover:ring-stone-300/90"
        : "bg-stone-100 shadow-[0_1px_0_rgb(255_255_255_0.95)_inset] ring-1 ring-stone-200/90 group-hover:bg-white group-hover:shadow-[0_8px_24px_-12px_rgb(28_25_23_/_0.08)]"
      : "bg-[var(--sx-navy-soft)] shadow-[0_1px_0_rgb(255_255_255_/_0.1)_inset] ring-1 ring-stone-800/15 group-hover:shadow-[0_6px_20px_-8px_rgb(28_25_23_/_0.15)]",
  ].join(" ");

  const svgDim = compact ? 15 : 18;

  const wordmark = [
    "translate-y-[0.5px] leading-none",
    compact ? "text-[14px] font-medium tracking-[-0.028em]" : "text-[17px] font-semibold tracking-[-0.032em]",
    onHero ? "text-stone-900" : "text-[var(--sx-navy)]",
  ].join(" ");

  return (
    <Link
      href="/"
      className={`group flex items-center outline-none ${compact ? "gap-2" : "gap-[0.625rem]"} ${className}`}
      aria-label="Stratxcel home"
    >
      <span className={iconClasses}>
        <svg
          width={svgDim}
          height={svgDim}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className={onHero ? "text-stone-800" : "text-stone-50"}
        >
          <path
            d="M3 6.5h14M3 10h10M3 13.5h14"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity="0.88"
          />
          <circle cx="15.5" cy="10" r="1.85" fill="currentColor" opacity="0.35" />
          <circle cx="15.5" cy="10" r="0.9" fill="currentColor" />
        </svg>
      </span>
      <span className={wordmark}>Stratxcel</span>
    </Link>
  );
}
