import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiWorkspacePage() {
  return (
    <div className="p-3 md:p-6">
      <Card className="mx-auto max-w-2xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">AI workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">Centralize prompts, evals, and model routing away from operators.</CardContent>
      </Card>
    </div>
  );
}
