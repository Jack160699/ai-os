import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminAuth } from "@/app/admin/_lib/auth";
import { TeamWorkspace } from "@/components/team/TeamWorkspace";

export default async function AdminTeamPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/team"
      title="Team"
      subtitle="Manage members, roles, and accountability with a clean activity trail."
    >
      <TeamWorkspace />
    </AdminShell>
  );
}

