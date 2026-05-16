"use client";

import { Fragment, useEffect, useState } from "react";

/**
 * Loads cinematic canvas + cursor glow after idle so the Server shell stays lean
 * and first paint is not blocked by rAF-heavy modules.
 */
export function DeferredShellEffects() {
  const [nodes, setNodes] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (cancelled) return;
      void Promise.all([
        import("@/app/components/SpaceFieldBackground"),
        import("@/app/components/CursorAmbient"),
      ]).then(([spaceMod, cursorMod]) => {
        if (cancelled) return;
        const Space = spaceMod.SpaceFieldBackground;
        const Cursor = cursorMod.CursorAmbient;
        setNodes(
          <Fragment>
            <Space />
            <Cursor />
          </Fragment>
        );
      });
    };
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? () => window.requestIdleCallback(load, { timeout: 2000 })
        : () => window.setTimeout(load, 100);
    schedule();
    return () => {
      cancelled = true;
    };
  }, []);

  return nodes;
}
