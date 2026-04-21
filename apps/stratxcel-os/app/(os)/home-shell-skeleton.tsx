import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeShellSkeleton() {
  return (
    <div className="relative min-h-[60vh] w-full px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.45_0.15_270/0.12),transparent)]" />
      <div className="relative mx-auto max-w-[1600px] space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40 rounded bg-white/[0.08]" />
          <Skeleton className="h-9 w-full max-w-md rounded-lg bg-white/[0.1]" />
          <Skeleton className="h-4 w-full max-w-2xl rounded bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl border-white/[0.06] bg-white/[0.03]">
              <CardHeader className="space-y-2 pb-2 pt-4">
                <Skeleton className="h-3 w-24 rounded bg-white/[0.08]" />
                <Skeleton className="h-8 w-28 rounded-md bg-white/[0.1]" />
                <Skeleton className="h-3 w-full rounded bg-white/[0.06]" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Card className="rounded-xl border-white/[0.06] bg-white/[0.03]">
              <CardHeader className="pb-2 pt-4">
                <Skeleton className="h-4 w-48 rounded bg-white/[0.08]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[280px] w-full rounded-lg bg-white/[0.05]" />
              </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-64 rounded-xl bg-white/[0.04]" />
              <Skeleton className="h-64 rounded-xl bg-white/[0.04]" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl bg-white/[0.04]" />
            <Skeleton className="h-48 rounded-xl bg-white/[0.04]" />
            <Skeleton className="h-56 rounded-xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
}
