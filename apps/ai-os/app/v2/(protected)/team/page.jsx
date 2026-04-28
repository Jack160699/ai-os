import { PageHeader } from "@/components/v2/page-header";
import { TeamManager } from "@/components/v2/team-manager";

export default function TeamPage() {
  return (
    <section>
      <PageHeader title="Team" subtitle="Create users, assign roles, reset passwords, and deactivate access." />
      <TeamManager />
    </section>
  );
}
