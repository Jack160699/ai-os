import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminAuth } from "@/app/admin/_lib/auth";
import { PaymentsPanel } from "@/components/dashboard/PaymentsPanel";

export default async function AdminBillingPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/billing"
      title="Billing & Payments"
      subtitle="Generate links, track collections, and keep payout operations clean."
    >
      <PaymentsPanel />
    </AdminShell>
  );
}

