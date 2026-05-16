import { permanentRedirect } from "next/navigation";
import { URLS } from "@stratxcel/config";

function caseStudiesUrl() {
  const base = String(URLS.aiMarketing || "https://stratxcel.ai").replace(/\/+$/, "");
  return `${base}/case-studies`;
}

export default function ResultsPage() {
  permanentRedirect(caseStudiesUrl());
}
