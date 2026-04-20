import { createProposalTemplate } from "@/app/(os)/actions";
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
