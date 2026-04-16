import { redirect } from "next/navigation";

export const metadata = {
  title: "About — Stratxcel",
};

export default function AboutPage() {
  redirect("/#about");
}
