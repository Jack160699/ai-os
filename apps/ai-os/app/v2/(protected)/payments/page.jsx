import { PageHeader } from "@/components/v2/page-header";
import { PaymentsRecords } from "@/components/v2/payments-records";

export default function PaymentsPage() {
  return (
    <section>
      <PageHeader
        title="Payments"
        subtitle="Finance-grade records with fast filters, search, and status clarity."
      />
      <PaymentsRecords />
    </section>
  );
}
