import { OsShell } from "@/components/os/os-shell";
import { WorkspaceProvider } from "@/components/os/workspace-context";
import { createClient } from "@/lib/supabase/server";

export default async function OsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata as Record<string, string | undefined> | undefined;
  const userLabel =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    user?.email?.split("@")[0] ||
    "Operator";

  return (
    <WorkspaceProvider>
      <OsShell userLabel={userLabel}>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </OsShell>
    </WorkspaceProvider>
  );
}
