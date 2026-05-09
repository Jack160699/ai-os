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
    <>
      <button
        onClick={async () => {
          const res = await fetch("/api/webhook/debug/message-pipeline", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-dashboard-password": process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || "test",
            },
            body: JSON.stringify({
              phone: "9999999999",
              text: "BUTTON TEST MESSAGE",
              direction: "in",
            }),
          });

          const data = await res.json();
          console.log("DEBUG RESULT:", data);
          alert("Message sent");
        }}
      >
        TEST INSERT
      </button>
      <section>
        <PageHeader page="inbox" />
        <InboxWorkspace />
      </section>
    </>
  );
}
