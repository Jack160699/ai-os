export const metadata = { title: "Features — Stratxcel AI" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Features</h1>
      <ul className="mt-8 list-disc space-y-3 pl-5 text-slate-600">
        <li>Unified pipeline graph with approvals and audit trails</li>
        <li>Agent envelopes with tool policies and human-in-the-loop</li>
        <li>Billing and payment links native to your workspace</li>
        <li>Role-based access for owner, manager, sales, ops, and viewer</li>
      </ul>
    </div>
  );
}
