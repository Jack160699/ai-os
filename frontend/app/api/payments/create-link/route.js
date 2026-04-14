import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { POST as createPaymentLinkPost } from "@/lib/payments/createPaymentLinkApi";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;
  return createPaymentLinkPost(request);
}
