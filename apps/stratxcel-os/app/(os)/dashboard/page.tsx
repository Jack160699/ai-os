import { redirect } from "next/navigation";

/** Canonical home is `/`; `/dashboard` is a friendly alias for links and bookmarks. */
export default function DashboardAliasPage() {
  redirect("/");
}
