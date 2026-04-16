import { CONTACT_EMAIL } from "@stratxcel/config";

export const metadata = { title: "Book a demo — Stratxcel AI" };

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Book a demo</h1>
      <p className="mt-4 text-slate-600">
        Email{" "}
        <a className="font-medium text-blue-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>{" "}
        with your team size, stack, and the workflow you want to prove in 30 days.
      </p>
    </div>
  );
}
