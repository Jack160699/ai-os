"use client";

import dynamic from "next/dynamic";

const CopilotPanel = dynamic(() => import("@/components/copilot/CopilotPanel").then((m) => m.CopilotPanel), {
  loading: () => null,
});

/**
 * Renders the AI copilot outside `main.admin-app` so `position: fixed` is not
 * clipped by overflow/stacking contexts inside the shell.
 */
export function AdminAssistantRoot() {
  return <CopilotPanel />;
}
