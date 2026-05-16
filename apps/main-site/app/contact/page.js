import { PageLayout } from "@/app/components/PageLayout";
import { ContactPageBody } from "./ContactPageBody";

export const metadata = {
  title: "Contact — Stratxcel",
  description: "Short form or WhatsApp — tell us your name, business, and what you need. We reply like humans.",
};

export default function ContactPage() {
  return (
    <PageLayout title="Let's talk about your business" eyebrow="Contact" wideForm>
      <ContactPageBody />
    </PageLayout>
  );
}
