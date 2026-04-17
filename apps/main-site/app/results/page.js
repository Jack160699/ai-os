import { redirect } from "next/navigation";

export const metadata = {
  title: "Results — Stratxcel",
};

export default function ResultsPage() {
  redirect("/#cases");
}
