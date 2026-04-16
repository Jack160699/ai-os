import { CONTACT_EMAIL } from "@stratxcel/config";

export const metadata = { title: "Waitlist — Stratxcel AI" };

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Waitlist</h1>
      <p className="mt-4 text-slate-600">
        We onboard in cohorts to preserve support quality. Request access via{" "}
        <a className="font-medium text-blue-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
