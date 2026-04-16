import { CONTACT_EMAIL } from "@stratxcel/config";

export const metadata = {
  title: "Contact — Stratxcel",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Contact</h1>
      <p className="mt-6 text-slate-600 leading-relaxed">
        Email{" "}
        <a className="font-medium text-blue-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>{" "}
        with context on your stack, volumes, and the outcome you need in the next 90 days.
      </p>
    </div>
  );
}
