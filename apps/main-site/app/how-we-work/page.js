import { redirect } from "next/navigation";

export const metadata = {
  title: "How We Work — Stratxcel",
};

export default function HowWeWorkPage() {
  redirect("/#how-we-work");
}
