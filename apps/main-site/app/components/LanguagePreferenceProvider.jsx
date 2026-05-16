"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export const LANGUAGE_STORAGE_KEY = "stratxcel_language_experience";
export const LANGUAGE_HINGLISH = "hinglish";
export const LANGUAGE_ENGLISH = "english";

const LanguagePreferenceContext = createContext(null);

function applyExperienceToDocument(value) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.sxLanguageExperience = value;
}

function readStored() {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === LANGUAGE_HINGLISH || raw === LANGUAGE_ENGLISH) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

/** Client-only snapshot for UI (e.g. hero copy). Returns null on server. */
export function getStoredLanguageExperience() {
  if (typeof window === "undefined") return null;
  return readStored();
}

export function useLanguagePreference() {
  const ctx = useContext(LanguagePreferenceContext);
  if (!ctx) {
    throw new Error("useLanguagePreference must be used within LanguagePreferenceProvider");
  }
  return ctx;
}

/**
 * First-visit language gate: premium overlay, localStorage, reopen from nav.
 */
export function LanguagePreferenceProvider({ children }) {
  const titleId = useId();
  const descId = useId();
  const primaryRef = useRef(null);

  const [hydrated, setHydrated] = useState(false);
  const [experience, setExperienceState] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [visualEnter, setVisualEnter] = useState(false);
  const [allowDismiss, setAllowDismiss] = useState(false);

  const closeTimerRef = useRef(0);

  const finishClose = useCallback(() => {
    setVisualEnter(false);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOverlayOpen(false);
    }, 320);
  }, []);

  const commitChoice = useCallback(
    (value) => {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = 0;
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
      } catch {
        /* ignore quota / private mode */
      }
      setExperienceState(value);
      applyExperienceToDocument(value);
      setAllowDismiss(true);
      finishClose();
    },
    [finishClose]
  );

  const openLanguageSelector = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = 0;
    setAllowDismiss(readStored() !== null);
    setOverlayOpen(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setVisualEnter(true));
    });
  }, []);

  useLayoutEffect(() => {
    const stored = readStored();
    queueMicrotask(() => {
      setHydrated(true);
      if (stored) {
        setExperienceState(stored);
        applyExperienceToDocument(stored);
        setAllowDismiss(true);
        setOverlayOpen(false);
        return;
      }
      setAllowDismiss(false);
      setOverlayOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!overlayOpen) {
      const id = window.requestAnimationFrame(() => setVisualEnter(false));
      return () => window.cancelAnimationFrame(id);
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setVisualEnter(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen || !visualEnter) return;
    const t = window.setTimeout(() => primaryRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [overlayOpen, visualEnter]);

  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (!allowDismiss) return;
      finishClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, allowDismiss, finishClose]);

  useEffect(() => {
    return () => window.clearTimeout(closeTimerRef.current);
  }, []);

  const onBackdropPointerDown = useCallback(() => {
    if (!allowDismiss) return;
    finishClose();
  }, [allowDismiss, finishClose]);

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const ctx = {
    experience: hydrated ? experience : null,
    openLanguageSelector,
    /** hinglish | english once chosen */
    isHinglish: experience === LANGUAGE_HINGLISH,
  };

  return (
    <LanguagePreferenceContext.Provider value={ctx}>
      {children}
      {overlayOpen ? (
        <div
          className="fixed inset-0 z-[220] flex items-end justify-center sm:items-center sm:p-6"
          role="presentation"
        >
          <div
            role={allowDismiss ? "button" : undefined}
            tabIndex={allowDismiss ? 0 : -1}
            aria-label={allowDismiss ? "Close language selection" : undefined}
            className={[
              "absolute inset-0 bg-black/50 transition-[opacity,backdrop-filter] duration-300 ease-out motion-reduce:transition-none",
              reduceMotion ? "backdrop-blur-md" : "backdrop-blur-xl",
              visualEnter ? "opacity-100" : "opacity-0",
              allowDismiss ? "cursor-pointer" : "cursor-default",
            ].join(" ")}
            style={{ WebkitBackdropFilter: reduceMotion ? "blur(12px)" : "blur(28px)" }}
            onClick={onBackdropPointerDown}
            onKeyDown={(e) => {
              if (!allowDismiss) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                finishClose();
              }
            }}
          />

          <div
            className={[
              "relative z-10 mx-auto w-full max-w-[min(100%,26rem)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-0 sm:pb-0 sm:pt-0",
              "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              visualEnter ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-3 opacity-0 sm:translate-y-1 sm:scale-[0.98]",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
          >
            <div
              className={[
                "relative overflow-hidden rounded-[1.35rem] border border-white/[0.11] p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.55)_inset,0_32px_80px_-40px_rgba(0,0,0,0.85),0_0_100px_-48px_rgba(59,130,246,0.18)] sm:rounded-[1.5rem] sm:p-8",
                "bg-[linear-gradient(168deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_40%,rgba(11,15,25,0.88)_100%)]",
                "backdrop-blur-2xl backdrop-saturate-150",
              ].join(" ")}
            >
              <div
                className="pointer-events-none absolute -left-1/4 top-0 h-[55%] w-[70%] rounded-full bg-sky-500/[0.07] blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-1/5 bottom-0 h-[45%] w-[55%] rounded-full bg-indigo-500/[0.05] blur-3xl"
                aria-hidden
              />

              <div className="relative text-center">
                <h2
                  id={titleId}
                  className="text-balance text-[1.35rem] font-semibold leading-snug tracking-[-0.035em] text-[#F4F4F5] sm:text-[1.5rem]"
                >
                  Let&apos;s keep things simple.
                </h2>
                <p
                  id={descId}
                  className="mx-auto mt-3 max-w-[32ch] text-[14px] leading-relaxed text-zinc-400 sm:text-[15px]"
                >
                  Choose the experience that feels most comfortable to you.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <button
                    ref={primaryRef}
                    type="button"
                    className={[
                      "group relative w-full rounded-2xl border border-sky-400/35 bg-[#0B0F19]/90 px-5 py-4 text-center transition-[transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none",
                      "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_0_64px_-20px_rgba(59,130,246,0.45),0_20px_48px_-28px_rgba(0,0,0,0.65)]",
                      "hover:border-sky-400/50 hover:shadow-[0_0_0_1px_rgba(147,197,253,0.15)_inset,0_0_72px_-16px_rgba(59,130,246,0.55),0_24px_56px_-26px_rgba(0,0,0,0.72)]",
                      "active:translate-y-px",
                    ].join(" ")}
                    onClick={() => commitChoice(LANGUAGE_HINGLISH)}
                  >
                    <span className="block text-[15px] font-semibold tracking-[-0.02em] text-[#E5E7EB] sm:text-[16px]">
                      Hindi + English (Easy to Understand)
                    </span>
                  </button>

                  <button
                    type="button"
                    className={[
                      "w-full rounded-2xl border border-white/[0.14] bg-white/[0.04] px-5 py-3.5 text-[14px] font-semibold tracking-[-0.015em] text-zinc-200 transition-[transform,background-color,border-color] duration-300 ease-out motion-reduce:transition-none",
                      "hover:border-white/22 hover:bg-white/[0.07] active:translate-y-px",
                    ].join(" ")}
                    onClick={() => commitChoice(LANGUAGE_ENGLISH)}
                  >
                    Continue in English
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </LanguagePreferenceContext.Provider>
  );
}
