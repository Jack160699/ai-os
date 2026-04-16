import Link from "next/link";

/** Icon + wordmark — matches premium B2B nav treatment. */
export function StratxcelBrand({ className = "" }) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-[0.625rem] outline-none ${className}`}
      aria-label="Stratxcel home"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[var(--sx-navy)] shadow-[0_1px_0_rgba(255,255,255,0.07)_inset,0_1px_2px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.22] transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_3px_10px_-3px_rgba(12,18,34,0.45)] group-active:scale-[0.98]">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="text-white/[0.94]">
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
      <span className="translate-y-[0.5px] text-[17px] font-semibold leading-none tracking-[-0.032em] text-[var(--sx-navy)]">
        Stratxcel
      </span>
    </Link>
  );
}
