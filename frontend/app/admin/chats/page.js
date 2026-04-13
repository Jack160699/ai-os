import { AdminShell } from "@/app/admin/_components/AdminShell";
import { ChatsInbox } from "@/components/chat/ChatsInbox";
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
      subtitle="WhatsApp threads from memory.json—polled every few seconds; replies send through Cloud API."
    >
      <ChatsInbox />
    </AdminShell>
  );
}
