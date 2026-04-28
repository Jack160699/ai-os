"use client";

import { useEffect, useState } from "react";

const KEY = "v2-pro-mode";

export function readProMode() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function writeProMode(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, value ? "1" : "0");
  window.dispatchEvent(new CustomEvent("v2:pro-mode", { detail: { value } }));
}

export function useProMode() {
  const [proMode, setProMode] = useState(() => readProMode());

  useEffect(() => {
    const onMode = (event) => setProMode(Boolean(event?.detail?.value));
    window.addEventListener("v2:pro-mode", onMode);
    return () => window.removeEventListener("v2:pro-mode", onMode);
  }, []);

  return { proMode, setProMode: (next) => writeProMode(Boolean(next)) };
}
