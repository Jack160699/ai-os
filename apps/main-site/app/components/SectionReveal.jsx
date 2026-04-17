"use client";

import { useEffect, useRef, useState } from "react";

/** Once in view, stays revealed — calm scroll fade-in. */
export function SectionReveal({ children, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.06, rootMargin: "0px 0px -6% 0px" }
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
