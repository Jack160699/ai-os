import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-6 md:p-10">
      <h1 className="text-xl font-semibold tracking-tight text-white">Analytics</h1>
      <p className="text-sm leading-relaxed text-slate-400">
        Deep reporting views are shipping next. Your live KPIs and charts stay on the status hub dashboard.
      </p>
      <Button asChild variant="secondary" className="w-fit border-white/10">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
