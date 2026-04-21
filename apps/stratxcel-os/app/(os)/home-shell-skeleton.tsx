import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeShellSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded-md bg-white/[0.08]" />
        <Skeleton className="h-4 w-full max-w-md rounded-md bg-white/[0.06]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="space-y-2 pb-2 pt-4">
              <Skeleton className="h-3 w-24 rounded bg-white/[0.08]" />
              <Skeleton className="h-8 w-20 rounded-md bg-white/[0.1]" />
            </CardHeader>
            <CardContent className="pb-4">
              <Skeleton className="h-3 w-full rounded bg-white/[0.06]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-2 pt-4">
              <Skeleton className="h-4 w-32 rounded bg-white/[0.08]" />
              <Skeleton className="mt-2 h-3 w-48 rounded bg-white/[0.06]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full rounded-lg bg-white/[0.05]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40 rounded bg-white/[0.08]" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 4 }).map((__, j) => (
                <Skeleton key={j} className="h-14 w-full rounded-lg bg-white/[0.05]" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
