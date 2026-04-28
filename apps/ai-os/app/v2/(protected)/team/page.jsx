import { PageHeader } from "@/components/v2/page-header";
import { TeamManager } from "@/components/v2/team-manager";

export default function TeamPage() {
  return (
    <section>
      <PageHeader title="Team" subtitle="Manage operators, roles, and permissions with precision." />
      <TeamManager />
    </section>
  );
}
