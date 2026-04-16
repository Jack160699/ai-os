import { AdminShell } from "@/app/admin/_components/AdminShell";
import { AiControlCenter } from "@/components/ai-control/AiControlCenter";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

export default async function AiControlPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/ai-control"
      title="AI Control Center"
      subtitle="Admin-grade cockpit for logs, permissions, custom commands, and mock action queues—wire to your audit trail when ready."
    >
      <AiControlCenter />
    </AdminShell>
  );
}
