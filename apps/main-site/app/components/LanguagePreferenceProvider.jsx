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
    }, 260);
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
          className="fixed inset-0 z-[220] flex items-end justify-center sm:items-center sm:p-5"
          role="presentation"
        >
          {/* Light veil — homepage stays visible with subtle blur */}
          <div
            role={allowDismiss ? "button" : undefined}
            tabIndex={allowDismiss ? 0 : -1}
            aria-label={allowDismiss ? "Close language selection" : undefined}
            className={[
              "absolute inset-0 bg-stone-100/50 transition-opacity duration-200 ease-out motion-reduce:transition-none",
              "backdrop-blur-[4px] sm:backdrop-blur-[6px] motion-reduce:backdrop-blur-none",
              visualEnter ? "opacity-100" : "opacity-0",
              allowDismiss ? "cursor-pointer" : "cursor-default",
            ].join(" ")}
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
              "relative z-10 mx-auto w-full max-w-[min(100%,24rem)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:px-0 sm:pb-0 sm:pt-0",
              "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
              visualEnter ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 sm:translate-y-1",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
          >
            <div
              className={[
                "relative overflow-hidden rounded-t-[1.75rem] border border-white/70 sm:rounded-[2rem]",
                "bg-white/85 p-7 shadow-[0_32px_64px_-28px_rgba(28,25,23,0.14),0_0_0_1px_rgba(255,255,255,0.85)_inset]",
                "backdrop-blur-sm sm:p-9 sm:backdrop-blur-md",
              ].join(" ")}
            >
              {/* Very soft warmth behind content — not a heavy scene */}
              <div
                className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-amber-100/35 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-stone-200/40 blur-3xl"
                aria-hidden
              />

              <div className="relative text-center">
                <h2
                  id={titleId}
                  className="text-balance text-[1.45rem] font-semibold leading-snug tracking-[-0.03em] text-stone-900 sm:text-[1.55rem]"
                >
                  Bas simple rakhte hain.
                </h2>
                <p
                  id={descId}
                  className="mx-auto mt-3 max-w-[34ch] text-[15px] leading-relaxed text-stone-500 sm:text-[16px]"
                >
                  Jo bhasha theek lage, woh chuno.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:mt-10">
                  {/* Primary: warm, approachable, human */}
                  <button
                    ref={primaryRef}
                    type="button"
                    className={[
                      "w-full rounded-2xl border border-amber-200/40 px-5 py-[1.05rem] text-center shadow-[0_1px_0_rgba(255,250,245,0.24)_inset,0_14px_36px_-14px_rgba(62,48,38,0.28)] transition-[transform,box-shadow,filter] duration-200 ease-out motion-reduce:transition-none",
                      "bg-gradient-to-br from-[#5a4c42] via-[#453a33] to-[#342e29] hover:brightness-[1.04] hover:shadow-[0_1px_0_rgba(255,250,245,0.3)_inset,0_18px_40px_-12px_rgba(62,48,38,0.32)]",
                      "active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white/90",
                    ].join(" ")}
                    onClick={() => commitChoice(LANGUAGE_HINGLISH)}
                  >
                    <span className="block text-[15px] font-semibold leading-snug tracking-[-0.018em] text-[#faf6f1] sm:text-[16px]">
                      Hindi + English — seedhi, simple baat
                    </span>
                  </button>

                  {/* Secondary: clean, premium, lighter */}
                  <button
                    type="button"
                    className={[
                      "w-full rounded-2xl border border-stone-200/95 bg-white/65 px-5 py-3.5 text-[14px] font-medium tracking-[-0.01em] text-stone-700 shadow-sm transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
                      "hover:border-stone-300 hover:bg-white hover:shadow-md",
                      "active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white/90",
                    ].join(" ")}
                    onClick={() => commitChoice(LANGUAGE_ENGLISH)}
                  >
                    Sirf English mein
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
