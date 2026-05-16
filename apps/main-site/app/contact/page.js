import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Contact — Stratxcel",
};

function waHref() {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const prefill = "Hi — I'd like to start a conversation with StratXcel. Here's what I need help with: ";
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}` : "#";
}

export default function ContactPage() {
  return (
    <PageLayout title="Let's talk about your business" eyebrow="Contact">
      <p className="text-stone-700">Tell us what you need help with — WhatsApp is fastest.</p>
      <p className="mt-6">
        <a
          href={waHref()}
          className="font-semibold text-stone-900 underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat on WhatsApp
        </a>
      </p>
      <p className="mt-6 text-sm text-stone-600">
        Prefer email?{" "}
        <a className="font-medium text-stone-800 underline-offset-4 hover:underline" href={`mailto:${CONTACT.email}`}>
          {CONTACT.email}
        </a>
      </p>
      <p className="mt-8 text-sm text-stone-600">
        <Link href="/" className="font-medium text-stone-800 underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </PageLayout>
  );
}
