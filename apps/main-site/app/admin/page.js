import Link from "next/link";
import { URLS } from "@stratxcel/config";

export const metadata = {
  title: "Admin — Stratxcel",
};

export default function AdminEntryPage() {
  return (
    <div className="mx-auto max-w-2xl border-b border-white/[0.06] px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-50">Admin access</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
        Internal software runs on the AI OS deployment. Use the dedicated subdomain for dashboards,
        billing, and team tools.
      </p>
      <Link
        href={URLS.aiOs}
        className="mt-8 inline-flex rounded-full border border-white/12 bg-white px-6 py-3 text-sm font-semibold text-[var(--sx-navy)] shadow-[0_0_28px_-10px_rgba(96,165,250,0.35)] transition hover:bg-zinc-100"
      >
        Open AI OS — {URLS.aiOs.replace(/^https?:\/\//, "")}
      </Link>
    </div>
  );
}
