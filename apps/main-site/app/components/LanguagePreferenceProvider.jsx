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

/** Primary key for language preference. */
export const LANGUAGE_STORAGE_KEY = "stratxcel_language_experience";
/** Legacy key — read for migration only. */
const LANGUAGE_LEGACY_MISNETEXT_KEY = "misnetext_language_experience";

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
      localStorage.removeItem(LANGUAGE_LEGACY_MISNETEXT_KEY);
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
          className="fixed inset-0 z-[600] flex items-end justify-center overscroll-none sm:items-center sm:p-4"
          role="presentation"
          style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <div
            role={allowDismiss ? "button" : undefined}
            tabIndex={allowDismiss ? 0 : -1}
            aria-label={allowDismiss ? "Close language selection" : undefined}
            className={[
              "absolute inset-0 bg-stone-800/[0.12] backdrop-blur-[8px] backdrop-saturate-[0.92] transition-opacity duration-300 ease-out motion-reduce:transition-none motion-reduce:backdrop-blur-sm",
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
              "relative z-10 mx-auto w-full max-w-[min(100%,21rem)] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:px-0 sm:pb-0",
              "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-150",
              panelEnter ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.99] opacity-0 sm:translate-y-2",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
          >
            <div
              className={[
                "rounded-t-2xl border border-stone-200/90 bg-[var(--sx-surface-elevated)] shadow-[var(--sx-shadow-md)] sm:rounded-2xl",
                "px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-5 sm:px-6 sm:pb-6 sm:pt-6",
              ].join(" ")}
            >
              <div className="text-center">
                <h2
                  id={titleId}
                  className="text-balance text-lg font-semibold leading-snug tracking-[-0.02em] text-stone-900 sm:text-[1.125rem]"
                >
                  Kaise baat karni hai?
                </h2>
                <p id={descId} className="mx-auto mt-2.5 max-w-[34ch] text-[14px] leading-relaxed text-stone-600 sm:text-[15px]">
                  Jo language comfortable lage, wahi choose kar lo.
                </p>

                <div className="mt-6 flex flex-col gap-2.5 sm:mt-7">
                  <button
                    ref={primaryRef}
                    type="button"
                    className={[
                      "w-full rounded-xl bg-stone-800 px-4 py-3 text-center text-[14px] font-semibold tracking-[-0.015em] text-stone-50 shadow-sm",
                      "transition-[background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
                      "hover:bg-stone-900 hover:shadow-md",
                      "active:bg-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2",
                    ].join(" ")}
                    onClick={() => commitChoice(LANGUAGE_HINGLISH)}
                  >
                    Hinglish — jaise normally baat karte ho
                  </button>

                  <button
                    type="button"
                    className={[
                      "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-center text-[14px] font-medium tracking-[-0.015em] text-stone-800 shadow-[0_1px_0_rgb(255_255_255/0.9)_inset]",
                      "transition-[background-color,border-color] duration-200 ease-out motion-reduce:transition-none",
                      "hover:border-stone-300 hover:bg-stone-50",
                      "active:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-2",
                    ].join(" ")}
                    onClick={() => commitChoice(LANGUAGE_ENGLISH)}
                  >
                    English
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
