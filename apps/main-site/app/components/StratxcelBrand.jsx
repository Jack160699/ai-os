import Link from "next/link";

/** Text-only wordmark. `compact` slightly tightens for the nav. `tone` kept for API compat. */
export function StratxcelBrand({ className = "", tone = "hero", compact = false }) {
  const _ = tone;
  const textClass = compact
    ? "text-[14px] font-semibold tracking-[-0.02em] text-stone-900 sm:text-[15px]"
    : "text-base font-semibold tracking-[-0.02em] text-stone-900 sm:text-[1.05rem]";

  return (
    <Link
      href="/"
      className={`inline-flex max-w-full items-center outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-stone-900/15 focus-visible:ring-offset-2 ${className}`}
      aria-label="Stratxcel home"
    >
      <span className={`truncate font-sans ${textClass}`}>Stratxcel</span>
    </Link>
  );
}
