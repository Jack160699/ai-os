import Link from "next/link";

/** Icon + wordmark — `tone="hero"` is the default light-site treatment (warm canvas). */
export function StratxcelBrand({ className = "", tone = "default" }) {
  const onHero = tone === "hero";
  return (
    <Link
      href="/"
      className={`group flex items-center gap-[0.625rem] outline-none ${className}`}
      aria-label="Stratxcel home"
    >
      <span
        className={[
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-[1.02] group-active:scale-[0.98]",
          onHero
            ? "bg-stone-100 shadow-[0_1px_0_rgb(255_255_255_0.95)_inset] ring-1 ring-stone-200/90 group-hover:bg-white group-hover:shadow-[0_8px_24px_-12px_rgb(28_25_23_/_0.08)]"
            : "bg-[var(--sx-navy-soft)] shadow-[0_1px_0_rgb(255_255_255_/_0.1)_inset] ring-1 ring-stone-800/15 group-hover:shadow-[0_6px_20px_-8px_rgb(28_25_23_/_0.15)]",
        ].join(" ")}
      >
        <svg
          width="18"
          height="18"
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
      <span
        className={[
          "translate-y-[0.5px] text-[17px] font-semibold leading-none tracking-[-0.032em]",
          onHero ? "text-stone-900" : "text-[var(--sx-navy)]",
        ].join(" ")}
      >
        Stratxcel
      </span>
    </Link>
  );
}
