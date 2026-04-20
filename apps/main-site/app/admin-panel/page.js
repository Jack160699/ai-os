import { redirect } from "next/navigation";
import { URLS } from "@stratxcel/config";

export const metadata = {
  title: "Admin Panel — Stratxcel",
};

export default function AdminPanelPage() {
  const aiOsBase = String(URLS.aiOs || "").trim().replace(/\/+$/, "");
  const fallbackBase = "https://ai-os-jack160699s-projects.vercel.app";
  const targetBase = /(^https?:\/\/)?ai\.stratxcel\.in$/i.test(aiOsBase.replace(/^https?:\/\//, "")) ? fallbackBase : aiOsBase;
  redirect(`${targetBase}/admin`);
}
