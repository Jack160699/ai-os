import { redirect } from "next/navigation";

export const metadata = {
  title: "Pricing — Stratxcel",
};

export default function PricingPage() {
  // Single-page site: keep this route for compatibility and forward to the section.
  // (No payment logic changes.)
  redirect("/#pricing");
}
