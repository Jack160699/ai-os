import { DEMO_URLS } from "@stratxcel/config";
import { LiveDemoLink } from "@/app/components/LiveDemoLink";

export const metadata = { title: "Premium consulting — Stratxcel demos" };

export default function Page() {
  const live = DEMO_URLS.premiumConsulting;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-white">Premium consulting</h1>
      <p className="mt-4 text-slate-300">
        Partner-grade consulting brand with case-led storytelling. Wire{" "}
        <code className="text-blue-200">NEXT_PUBLIC_DEMO_PREMIUM_CONSULTING_URL</code> to your consulting
        demo deployment (e.g. former <strong className="text-white">premium-consulting-demo</strong>).
      </p>
      <LiveDemoLink href={live}>Open live consulting demo</LiveDemoLink>
      {!live ? (
        <p className="mt-4 text-sm text-slate-500">
          Env var unset — portfolio card still works; add URL when the build is public.
        </p>
      ) : null}
    </div>
  );
}
