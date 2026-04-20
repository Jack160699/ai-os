import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AutomationPage() {
  return (
    <div className="p-3 md:p-6">
      <Card className="mx-auto max-w-2xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Automation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">Wire sequences here when you are ready — keep the main OS calm.</CardContent>
      </Card>
    </div>
  );
}
