"use client";

import { useEffect, useMemo, useState } from "react";

function formatValue(value, format) {
  if (format === "currency") return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  if (format === "percent") return `${Number(value || 0).toFixed(1)}%`;
  if (format === "time") return `${Number(value || 0).toFixed(1)} min`;
  return Number(value || 0).toLocaleString("en-IN");
}

export function PremiumCounter({ value = 0, format = "number", durationMs = 700 }) {
  const target = useMemo(() => Number(value || 0), [value]);
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    let frame = 0;
    let raf = 0;
    const totalFrames = Math.max(10, Math.floor(durationMs / 16));
    const start = display;
    const delta = target - start;
    const tick = () => {
      frame += 1;
      const t = Math.min(1, frame / totalFrames);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(start + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span>{formatValue(display, format)}</span>;
}

