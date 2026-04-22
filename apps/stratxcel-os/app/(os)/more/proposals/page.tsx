import { createProposalTemplate, generateProposalForLead } from "@/app/(os)/actions";
import { getResetBatchId } from "@/lib/batch";
import { getProposalTemplates } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ProposalsPage() {
  const batchId = await getResetBatchId();
  const templates = await getProposalTemplates(batchId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-3 md:p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Proposal templates</h1>
        <p className="text-sm text-slate-500">
          Tokens: {"{{full_name}}"}, {"{{phone}}"}, {"{{source}}"} in subject/body.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Add template</CardTitle>
          <CardDescription>Sends as one outbound message from Inbox → Proposal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProposalTemplate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject line (optional)</Label>
              <Input id="subject" name="subject" placeholder="Proposal — {{full_name}}" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <textarea
                id="body"
                name="body"
                required
                rows={8}
                className="admin-control w-full resize-y rounded-md px-3 py-2 text-sm text-foreground"
              />
            </div>
            <Button type="submit">Save template</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">One-click proposal send</CardTitle>
          <CardDescription>Generate proposal directly via Revenue Core API using lead phone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={generateProposalForLead} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Lead phone</Label>
              <Input id="phone" name="phone" required placeholder="919876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Input id="service" name="service" placeholder="website + automation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (INR)</Label>
              <Input id="budget" name="budget" inputMode="numeric" placeholder="50000" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="scope">Scope</Label>
              <textarea id="scope" name="scope" rows={4} className="admin-control w-full rounded-md px-3 py-2 text-sm text-foreground" />
            </div>
            <Button type="submit" className="md:col-span-2">
              Generate proposal now
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {templates.map((t) => (
          <Card key={t.id} className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t.name}</CardTitle>
              {t.subject ? <CardDescription className="font-mono text-xs">{t.subject}</CardDescription> : null}
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{t.body}</pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
