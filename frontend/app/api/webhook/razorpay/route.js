import { POST as razorpayWebhookPost } from "@/lib/payments/razorpayWebhookApi";

export const dynamic = "force-dynamic";

export async function POST(request) {
  return razorpayWebhookPost(request);
}
