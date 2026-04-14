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
      title="Live inbox"
      subtitle="Premium conversation workspace for response speed, lead quality, and owner assignment."
    >
      <LiveInbox />
    </AdminShell>
  );
}
