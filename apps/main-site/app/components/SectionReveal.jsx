"use client";

/**
 * Former scroll-reveal wrapper — now a static pass-through for less JS, layout thrash,
 * and simpler perceived performance (content is visible immediately).
 */
export function SectionReveal({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}
