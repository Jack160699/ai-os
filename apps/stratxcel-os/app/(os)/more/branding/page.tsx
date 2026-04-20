import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BrandingPage() {
  return (
    <div className="p-3 md:p-6">
      <Card className="mx-auto max-w-2xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">Logos, outbound footers, and client-facing tone presets.</CardContent>
      </Card>
    </div>
  );
}
