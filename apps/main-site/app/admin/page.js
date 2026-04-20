import { redirect } from "next/navigation";
import { URLS } from "@stratxcel/config";

export const metadata = {
  title: "Admin — Stratxcel",
};

export default function AdminEntryPage() {
  redirect(`${URLS.aiOs}/admin`);
}
