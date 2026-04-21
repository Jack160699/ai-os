import { Suspense } from "react";
import { HomeContent } from "./home-content";
import { HomeShellSkeleton } from "./home-shell-skeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeShellSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
