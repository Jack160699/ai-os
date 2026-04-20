import { AdminShell } from "@/app/admin/_components/AdminShell";
import { LiveInbox } from "@/components/inbox/LiveInbox";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

export const metadata = {
  title: "Inbox - Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminChatsPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/chats"
      title="Inbox"
      subtitle="Three-panel conversation workspace with lead context and fast actions."
    >
      <LiveInbox />
    </AdminShell>
  );
}
