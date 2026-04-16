import Link from "next/link";
import { URLS } from "@stratxcel/config";

export const metadata = {
  title: "Admin — Stratxcel",
};

export default function AdminEntryPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Admin access</h1>
      <p className="mt-4 text-slate-600">
        Internal software runs on the AI OS deployment. Use the dedicated subdomain for dashboards,
        billing, and team tools.
      </p>
      <Link
        href={URLS.aiOs}
        className="mt-8 inline-flex rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800"
      >
        Open AI OS — {URLS.aiOs.replace(/^https?:\/\//, "")}
      </Link>
    </div>
  );
}
