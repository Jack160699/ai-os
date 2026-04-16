import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminAuth } from "@/app/admin/_lib/auth";
import { PaymentsWorkspace } from "@/components/payments/PaymentsWorkspace";

export default async function AdminPaymentsPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/payments"
      title="Payments"
      subtitle="Create links fast, send to WhatsApp, and track live payment outcomes."
    >
      <PaymentsWorkspace />
    </AdminShell>
  );
}

