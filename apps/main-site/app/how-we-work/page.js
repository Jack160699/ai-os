import { redirect } from "next/navigation";

/** Legacy URL — homepage is intentionally minimal; start on Contact. */
export default function HowWeWorkPage() {
  redirect("/contact");
}
