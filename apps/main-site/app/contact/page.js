import { redirect } from "next/navigation";

export const metadata = {
  title: "Contact — Stratxcel",
};

export default function ContactPage() {
  redirect("/#contact");
}
