"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

const trendTone = {
  up: "text-emerald-400/95",
  down: "text-rose-400/90",
  neutral: "text-slate-500",
};

function AnimatedValue({ value }) {
  const numeric = Number(value);
  const isNumeric = Number.isFinite(numeric);
  const displayValue = isNumeric ? Math.max(0, Math.trunc(numeric)) : null;
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString("en-IN"));
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!isNumeric) return undefined;
    if (reduce) {
      motionValue.set(displayValue);
      return undefined;
    }
    const controls = animate(motionValue, displayValue, {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [displayValue, isNumeric, motionValue, reduce]);

  if (!isNumeric) return value;
  return <motion.span>{rounded}</motion.span>;
}

export function KpiStatCard({ label, value, hint, trend, index = 0 }) {
  const reduce = useReducedMotion();
  const dir = trend?.direction === "up" || trend?.direction === "down" ? trend.direction : "neutral";
  const tone = trendTone[dir];

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1], delay: index * 0.045 }}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.995 }}
      className="admin-card-surface group rounded-[14px] border border-white/[0.07] bg-white/[0.022] p-5 transition-[border-color,background-color,transform,box-shadow] duration-200 hover:border-white/[0.12] hover:bg-white/[0.034]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.9rem]">
        <AnimatedValue value={value} />
      </p>
      {trend?.label ? (
        <p className={`mt-1.5 text-xs font-medium ${tone}`}>
          <span className="tabular-nums">{trend.label}</span>
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-[12px] leading-snug text-slate-500">{hint}</p> : null}
    </motion.div>
  );
}
