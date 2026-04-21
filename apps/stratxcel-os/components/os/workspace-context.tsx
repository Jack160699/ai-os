"use client";

import * as React from "react";

export type WorkspaceId = "india" | "global";

type Ctx = {
  id: WorkspaceId;
  label: string;
  setWorkspace: (id: WorkspaceId) => void;
};

const WorkspaceContext = React.createContext<Ctx | null>(null);

const LABELS: Record<WorkspaceId, string> = {
  india: "StratXcel India",
  global: "StratXcel Global",
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = React.useState<WorkspaceId>("india");

  const setWorkspace = React.useCallback((next: WorkspaceId) => {
    setId(next);
    try {
      localStorage.setItem("sx-workspace", next);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("sx-workspace");
      if (raw === "global" || raw === "india") setId(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo(
    () => ({ id, label: LABELS[id], setWorkspace }),
    [id, setWorkspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be under WorkspaceProvider");
  return ctx;
}

export function statusHubRegion(id: WorkspaceId): string {
  return id === "india" ? "SALES (INDIA)" : "OPERATIONS (GLOBAL)";
}
