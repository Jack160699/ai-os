"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/v2/page-header";
import { InboxWorkspace } from "@/components/v2/inbox-workspace";

export default function InboxPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (typeof window === "undefined") return null;
  if (!isClient) return null;

  return (
    <section>
      <PageHeader page="inbox" />
      <InboxWorkspace />
    </section>
  );
}
