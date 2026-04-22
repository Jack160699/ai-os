import { getResetBatchId } from "@/lib/batch";
import { saveCeoBridgeSettingsAction, setResetBatchCookie } from "@/app/(os)/actions";
import { coreGet } from "@/lib/revenue-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COMMAND_OPTIONS = [
  "today stats",
  "hot leads",
  "revenue",
  "pending followups",
  "create task",
  "assign lead",
  "start ads",
];

export default async function SettingsPage() {
  const current = await getResetBatchId();
  const ceo = await coreGet<{
    ok: boolean;
    owners?: string[];
    permissions?: string[];
    history?: Array<{
      id?: string;
      source_phone?: string;
      command?: string;
      intent?: string;
      status?: string;
      created_at?: string;
    }>;
  }>("/api/aiops/ceo/settings", { ok: false });
  const owners = ceo.owners || [];
  const permissions = ceo.permissions || [];
  const history = ceo.history || [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-3 md:p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-slate-500">Campaign controls, CEO WhatsApp bridge, and audit logs.</p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Active reset batch</CardTitle>
          <CardDescription>Only rows matching this `reset_batch_id` surface in the OS.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setResetBatchCookie} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="batchId">reset_batch_id (UUID)</Label>
              <Input id="batchId" name="batchId" defaultValue={current} className="font-mono text-xs" required />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Apply batch
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">CEO WhatsApp bridge</CardTitle>
          <CardDescription>Authorize owner numbers and command permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveCeoBridgeSettingsAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="owner_numbers">Owner numbers (comma/new line separated)</Label>
              <Input
                id="owner_numbers"
                name="owner_numbers"
                defaultValue={owners.join(", ")}
                placeholder="9198xxxxxxx, 9188xxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {COMMAND_OPTIONS.map((cmd) => (
                  <label key={cmd} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="permissions"
                      value={cmd}
                      defaultChecked={permissions.includes(cmd)}
                    />
                    <span>{cmd}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Save CEO bridge settings
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">CEO command history</CardTitle>
          <CardDescription>Last {history.length} commands received from authorized owners.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length ? (
            history.slice(0, 50).map((row, i) => (
              <div key={row.id || `${row.created_at || "t"}-${i}`} className="rounded-md border p-2 text-xs">
                <div className="font-medium text-slate-800">{row.command || "n/a"}</div>
                <div className="text-slate-500">
                  {row.intent || "unknown"} · {row.status || "unknown"} · {row.source_phone || "na"}
                </div>
                <div className="text-slate-400">{row.created_at || "-"}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No command logs yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
