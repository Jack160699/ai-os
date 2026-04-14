"use client";

import { AssistantWidget } from "@/components/assistant/AssistantWidget";

/**
 * Renders the AI assistant outside `main.admin-app` so `position: fixed` is not
 * clipped by overflow/stacking contexts inside the shell.
 */
export function AdminAssistantRoot() {
  return <AssistantWidget />;
}
