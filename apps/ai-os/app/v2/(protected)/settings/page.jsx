import { PageHeader } from "@/components/v2/page-header";

export default function SettingsPage() {
  return (
    <section>
      <PageHeader
        title="Settings"
        subtitle="Phase 2: company profile, WhatsApp API keys, and notifications."
      />
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
        Settings module scaffold is ready for next phase.
      </div>
    </section>
  );
}
