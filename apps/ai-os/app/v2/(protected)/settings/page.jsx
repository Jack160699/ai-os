import { PageHeader } from "@/components/v2/page-header";
import { SettingsPanel } from "@/components/v2/settings-panel";

export default function SettingsPage() {
  return (
    <section>
      <PageHeader page="settings" />
      <SettingsPanel />
    </section>
  );
}
