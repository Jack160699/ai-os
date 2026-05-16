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

/** Primary key — new brand session. */
export const LANGUAGE_STORAGE_KEY = "misnetext_language_experience";
/** Legacy Stratxcel key — read for migration only. */
const LANGUAGE_LEGACY_KEY = "stratxcel_language_experience";

export const LANGUAGE_HINGLISH = "hinglish";
export const LANGUAGE_ENGLISH = "english";

const LanguagePreferenceContext = createContext(null);

function applyExperienceToDocument(value) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.sxLanguageExperience = value;
}

function readStored() {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw !== LANGUAGE_HINGLISH && raw !== LANGUAGE_ENGLISH) {
      const legacy = localStorage.getItem(LANGUAGE_LEGACY_KEY);
      if (legacy === LANGUAGE_HINGLISH || legacy === LANGUAGE_ENGLISH) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, legacy);
        raw = legacy;
      }
    }
    if (raw === LANGUAGE_HINGLISH || raw === LANGUAGE_ENGLISH) return raw;
  } catch {
    /* private mode / blocked storage */
  }
  return null;
}

function writeStored(value) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    try {
      localStorage.removeItem(LANGUAGE_LEGACY_KEY);
    } catch {
      /* ignore */
    }
    const verify = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (verify !== value) return false;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("sx-language-change"));
    }
    return true;
  } catch {
    return false;
  }
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

function raf2(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

function openGateAnimation(setPanelEnter) {
  setPanelEnter(false);
  raf2(() => setPanelEnter(true));
}

/**
 * First-visit language gate: reliable client read + backup effect for hydration edge cases.
 */
export function LanguagePreferenceProvider({ children }) {
  const titleId = useId();
  const descId = useId();
  const primaryRef = useRef(null);
  const closeTimerRef = useRef(0);

  const [hydrated, setHydrated] = useState(false);
  const [experience, setExperienceState] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [panelEnter, setPanelEnter] = useState(false);
  const [allowDismiss, setAllowDismiss] = useState(false);
  const [backdropEnter, setBackdropEnter] = useState(false);

  const finishClose = useCallback(() => {
    setPanelEnter(false);
    setBackdropEnter(false);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOverlayOpen(false);
    }, 320);
  }, []);

  const commitChoice = useCallback(
    (value) => {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = 0;
      writeStored(value);
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
    setBackdropEnter(false);
    setPanelEnter(false);
    requestAnimationFrame(() => setBackdropEnter(true));
    openGateAnimation(setPanelEnter);
  }, []);

  const runGateFromStorage = useCallback(() => {
    const stored = readStored();
    setHydrated(true);

    if (stored) {
      setExperienceState(stored);
      applyExperienceToDocument(stored);
      setAllowDismiss(true);
      setOverlayOpen(false);
      setPanelEnter(false);
      setBackdropEnter(false);
      return;
    }

    setAllowDismiss(false);
    setOverlayOpen(true);
    setBackdropEnter(false);
    setPanelEnter(false);
    requestAnimationFrame(() => setBackdropEnter(true));
    openGateAnimation(setPanelEnter);
  }, []);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync localStorage read before paint so the language gate does not flash underlying content when unset
    runGateFromStorage();
  }, [runGateFromStorage]);

  /** Backup: if gate stayed closed while nothing is stored (hydration edge case), reopen. */
  useEffect(() => {
    if (!hydrated) return;
    const s = readStored();
    if (s) return;
    if (!overlayOpen) {
      queueMicrotask(() => {
        setAllowDismiss(false);
        setOverlayOpen(true);
        setBackdropEnter(false);
        setPanelEnter(false);
        requestAnimationFrame(() => setBackdropEnter(true));
        openGateAnimation(setPanelEnter);
      });
    }
  }, [overlayOpen, hydrated]);

  useEffect(() => {
    const onStorage = () => {
      const next = readStored();
      if (next) {
        setExperienceState(next);
        applyExperienceToDocument(next);
        setAllowDismiss(true);
        setPanelEnter(false);
        setBackdropEnter(false);
        setOverlayOpen(false);
      } else {
        runGateFromStorage();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("sx-language-change", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("sx-language-change", onStorage);
    };
  }, [runGateFromStorage]);

  useEffect(() => {
    if (!overlayOpen) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen || !panelEnter) return;
    const t = window.setTimeout(() => primaryRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [overlayOpen, panelEnter]);

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
    return () => {
      window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const onBackdropPointerDown = useCallback(() => {
    if (!allowDismiss) return;
    finishClose();
  }, [allowDismiss, finishClose]);

  const ctx = {
    experience: hydrated ? experience : null,
    openLanguageSelector,
    isHinglish: experience === LANGUAGE_HINGLISH,
  };

  return (
    <LanguagePreferenceContext.Provider value={ctx}>
      {children}
      {overlayOpen ? (
        <div
          className="fixed inset-0 z-[600] flex items-end justify-center overscroll-none sm:items-center sm:p-6"
          role="presentation"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div
            role={allowDismiss ? "button" : undefined}
            tabIndex={allowDismiss ? 0 : -1}
            aria-label={allowDismiss ? "Close language selection" : undefined}
            className={[
              "absolute inset-0 bg-stone-900/[0.14] backdrop-blur-[12px] backdrop-saturate-110 transition-opacity duration-500 ease-out motion-reduce:transition-none motion-reduce:backdrop-blur-md",
              allowDismiss ? "cursor-pointer" : "cursor-default",
              backdropEnter ? "opacity-100" : "opacity-0",
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
              "relative z-10 mx-auto w-full max-w-[min(100%,26rem)] px-3 pb-1 sm:px-0 sm:pb-0",
              "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-150",
              panelEnter ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.98] opacity-0 sm:translate-y-3",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
          >
            <div
              className={[
                "relative overflow-hidden rounded-t-[1.35rem] border border-white/55 sm:rounded-[1.5rem]",
                "bg-[linear-gradient(165deg,rgba(255,255,255,0.94)_0%,rgba(252,248,241,0.9)_45%,rgba(249,244,236,0.88)_100%)]",
                "p-7 shadow-[var(--sx-shadow-lg)] backdrop-blur-xl backdrop-saturate-105 sm:p-8",
              ].join(" ")}
            >
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_38%,transparent)] blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-[color-mix(in_srgb,var(--sx-green-mid)_06%,transparent)] blur-3xl"
                aria-hidden
              />

              <div className="relative text-center">
                <p className="sx-type-eyebrow text-[0.65rem] tracking-[0.22em] text-stone-500">First impression</p>
                <h2
                  id={titleId}
                  className="mt-3 text-balance text-[1.42rem] font-semibold leading-[1.18] tracking-[-0.028em] text-stone-900 sm:text-[1.52rem]"
                >
                  Kaise baat karein?
                </h2>
                <p
                  id={descId}
                  className="mx-auto mt-3 max-w-[36ch] text-[15px] leading-relaxed text-stone-600 sm:text-[15.5px]"
                >
                  Ek baar choose karo — site usi vibe mein chalegi. Jo natural lage, wahi select karo.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:mt-9">
                  <button
                    ref={primaryRef}
                    type="button"
                    className={[
                      "group w-full rounded-[1.05rem] border border-white/25 px-5 py-[1.1rem] text-center",
                      "bg-gradient-to-br from-[#3f3a36] via-[#2f2b28] to-[#252220]",
                      "shadow-[0_1px_0_rgba(255,253,248,0.12)_inset,0_20px_48px_-20px_rgba(28,25,23,0.45)]",
                      "transition-[transform,box-shadow,filter,border-color] duration-300 ease-out motion-reduce:transition-none",
                      "hover:border-white/35 hover:shadow-[0_1px_0_rgba(255,253,248,0.16)_inset,0_24px_52px_-18px_rgba(28,25,23,0.5)] hover:brightness-[1.03]",
                      "active:translate-y-px motion-safe:active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(255,252,246,0.95)]",
                    ].join(" ")}
                    onClick={() => commitChoice(LANGUAGE_HINGLISH)}
                  >
                    <span className="block text-[15px] font-semibold leading-snug tracking-[-0.015em] text-[#faf7f2] sm:text-[16px]">
                      Hinglish — jaise normal baat hoti hai
                    </span>
                    <span className="mt-1 block text-[12px] font-medium tracking-[-0.01em] text-[color-mix(in_srgb,#faf7f2_62%,transparent)]">
                      Relaxed, spoken, everyday
                    </span>
                  </button>

                  <button
                    type="button"
                    className={[
                      "w-full rounded-[1.05rem] border border-stone-200/95 bg-white/90 px-5 py-3.5",
                      "text-[14px] font-semibold tracking-[-0.012em] text-stone-800",
                      "shadow-[0_1px_0_rgb(255_255_255/0.95)_inset,var(--sx-shadow-sm)]",
                      "transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none",
                      "hover:border-stone-300 hover:bg-white hover:shadow-[var(--sx-shadow-md)]",
                      "active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white/95",
                    ].join(" ")}
                    onClick={() => commitChoice(LANGUAGE_ENGLISH)}
                  >
                    English — simple and clear
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
