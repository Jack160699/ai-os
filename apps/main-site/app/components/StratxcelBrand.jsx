import Link from "next/link";

/** Text-only wordmark — premium editorial caps. `compact` tightens for nav. `tone` kept for API compat; both map to the same light treatment. */
export function StratxcelBrand({ className = "", tone = "hero", compact = false }) {
  const _ = tone;
  const textClass = compact
    ? "text-[14px] font-semibold tracking-[0.16em] text-stone-900 sm:text-[15px] sm:tracking-[0.18em]"
    : "text-[16px] font-semibold tracking-[0.17em] text-stone-900 sm:text-[18px] sm:tracking-[0.2em]";

  return (
    <Link
      href="/"
      className={`group inline-flex items-center outline-none transition-opacity duration-200 hover:opacity-85 ${className}`}
      aria-label="MISNETEXT home"
    >
      <span className={`whitespace-nowrap font-sans uppercase ${textClass}`}>MISNETEXT</span>
    </Link>
  );
}
