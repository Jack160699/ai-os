import { redirect } from "next/navigation";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

/**
 * Marketing / docs sometimes say "inbox"; the live product route is `/admin/chats`.
 */
export default async function AdminInboxAliasPage() {
  await requireAdminAuth();
  redirect("/admin/chats");
}
