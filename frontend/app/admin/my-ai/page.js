import { AdminShell } from "@/app/admin/_components/AdminShell";
import { MyAiWorkspace } from "@/components/my-ai/MyAiWorkspace";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

export default async function MyAiPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/my-ai"
      title="My AI Workspace"
      subtitle="Your private StratXcel Copilot hub—prompts, history, automations, and productivity signals stay on-device until APIs connect."
    >
      <MyAiWorkspace />
    </AdminShell>
  );
}
