"use client";

import { useEffect, useRef, useState } from "react";

/** Once in view, stays revealed — calm scroll fade-in. Disconnects observer after reveal to save work. */
export function SectionReveal({ children, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setVisible(true));
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "120px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={[visible ? "sx-reveal--in" : "sx-reveal", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
