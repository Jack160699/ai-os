import { DEMO_URLS } from "@stratxcel/config";
import { LiveDemoLink } from "@/app/components/LiveDemoLink";

export const metadata = { title: "Hotel website — Stratxcel demos" };

export default function Page() {
  const live = DEMO_URLS.hotel;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-white">Hotel website</h1>
      <p className="mt-4 text-slate-300">
        Premium hospitality: hero video, room modules, and high-contrast booking paths. Source for this
        demo historically lived in the <strong className="text-white">grand-dhillon-website</strong> repo;
        point <code className="text-blue-200">NEXT_PUBLIC_DEMO_HOTEL_URL</code> at its deployed preview to
        surface a live link here.
      </p>
      <LiveDemoLink href={live}>Open live hotel demo</LiveDemoLink>
      {!live ? (
        <p className="mt-4 text-sm text-slate-500">
          Set <code className="text-slate-400">NEXT_PUBLIC_DEMO_HOTEL_URL</code> in the Vercel environment
          after you merge or deploy that codebase.
        </p>
      ) : null}
    </div>
  );
}
