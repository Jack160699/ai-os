import { PageLayout } from "@/app/components/PageLayout";
import { ContactPageBody } from "./ContactPageBody";

export const metadata = {
  title: "Contact — Stratxcel",
  description: "WhatsApp for a quick hello, or a short form if you prefer. We reply like humans.",
};

export default function ContactPage() {
  return (
    <PageLayout title="Let's talk about your business" eyebrow="Contact" wideForm>
      <ContactPageBody />
    </PageLayout>
  );
}
