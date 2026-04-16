import Link from "next/link";

/** Icon + wordmark — matches premium B2B nav treatment. */
export function StratxcelBrand({ className = "" }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 outline-none ${className}`} aria-label="Stratxcel home">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--sx-navy)] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] ring-1 ring-black/20 transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="text-white/95">
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
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--sx-navy)]">Stratxcel</span>
    </Link>
  );
}
