import { PageHeader } from "@/components/v2/page-header";
import { PaymentsRecords } from "@/components/v2/payments-records";

export default function PaymentsPage() {
  return (
    <section>
      <PageHeader
        title="Payments"
        subtitle="Recent payment records with clear status visibility."
      />
      <PaymentsRecords />
    </section>
  );
}
