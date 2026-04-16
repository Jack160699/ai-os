import { DEMO_URLS } from "@stratxcel/config";
import { LiveDemoLink } from "@/app/components/LiveDemoLink";

export const metadata = { title: "Honest asset management — Stratxcel demos" };

export default function Page() {
  const live = DEMO_URLS.honestAsset;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-white">Honest asset management</h1>
      <p className="mt-4 text-slate-300">
        Trust-first wealth narrative with compliance-aware tone. Merge the{" "}
        <strong className="text-white">honest-asset-management</strong> repo into this monorepo or deploy it
        separately, then set <code className="text-blue-200">NEXT_PUBLIC_DEMO_HONEST_ASSET_URL</code>.
      </p>
      <LiveDemoLink href={live}>Open live demo</LiveDemoLink>
      {!live ? (
        <p className="mt-4 text-sm text-slate-500">
          No live URL configured — add the env var on Vercel for this app when the deployment exists.
        </p>
      ) : null}
    </div>
  );
}
