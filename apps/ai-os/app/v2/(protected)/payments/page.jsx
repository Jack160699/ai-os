import { PageHeader } from "@/components/v2/page-header";
import { PaymentsRecords } from "@/components/v2/payments-records";

export default function PaymentsPage() {
  return (
    <section>
      <PageHeader page="payments" />
      <PaymentsRecords />
    </section>
  );
}
