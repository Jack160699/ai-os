import { getResetBatchId } from "@/lib/batch";
import { setResetBatchCookie } from "@/app/(os)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const current = await getResetBatchId();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-3 md:p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-slate-500">Campaign batch isolation.</p>
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
    </div>
  );
}
