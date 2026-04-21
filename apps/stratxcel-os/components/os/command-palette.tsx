"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { OS_MAIN_NAV } from "@/lib/os-nav";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
  const [q, setQ] = React.useState("");
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      setQ("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return OS_MAIN_NAV;
    return OS_MAIN_NAV.filter(
      (n) =>
        n.label.toLowerCase().includes(s) ||
        n.href.includes(s) ||
        n.keywords.some((k) => k.includes(s)),
    );
  }, [q]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-white/[0.1] bg-[oklch(0.14_0.02_260)] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
              <Search className="size-4 shrink-0 text-slate-500" />
              <Input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Global command bar — jump to…"
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <ul className="max-h-[min(50vh,20rem)] overflow-y-auto p-1">
              {filtered.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200",
                      "hover:bg-white/[0.06]",
                    )}
                  >
                    <n.icon className="size-4 text-slate-500" />
                    {n.label}
                    <span className="ml-auto font-mono text-[10px] text-slate-600">{n.href}</span>
                  </Link>
                </li>
              ))}
              {filtered.length === 0 ? <p className="px-3 py-6 text-center text-sm text-slate-500">No matches</p> : null}
            </ul>
            <div className="border-t border-white/[0.06] px-3 py-2 text-[11px] text-slate-500">
              <button type="button" className="text-sky-400 hover:underline" onClick={() => go("/leads")}>
                Open Leads
              </button>
              <span className="mx-2">·</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
