import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamPage() {
  return (
    <div className="p-3 md:p-6">
      <Card className="mx-auto max-w-2xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Team</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">Invite operators and define who can reset batches.</CardContent>
      </Card>
    </div>
  );
}
