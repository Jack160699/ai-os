export const INBOX_FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "hot", label: "Hot Leads" },
  { id: "closed", label: "Closed" },
];

export const QUICK_REPLIES = [
  { id: "hello", label: "Hello", text: "Hello! Thanks for reaching out to StratXcel. How can I help you today?" },
  { id: "pricing", label: "Pricing", text: "Happy to share pricing. Can I understand your team size and use-case first?" },
  { id: "book-call", label: "Book call", text: "Let us schedule a quick call. What time works for you today?" },
  { id: "payment-link", label: "Payment link", text: "I can send a payment link right away. Please confirm the billing name." },
  { id: "follow-up", label: "Follow up tomorrow", text: "Noted. I will follow up tomorrow with the next steps." },
];

/** IDs match backend `app/whatsapp/quick_reply_templates.py` — sent via one-click WhatsApp. */
export const WHATSAPP_QUICK_TEMPLATES = [
  { id: "qr_payment_nudge", label: "Payment nudge" },
  { id: "qr_book_call", label: "Book call" },
  { id: "qr_clarify_need", label: "Clarify need" },
  { id: "qr_social_proof", label: "Social proof" },
  { id: "qr_followup_value", label: "Value FU" },
  { id: "qr_human_handoff", label: "Human handoff" },
];

export const OWNER_OPTIONS = ["Unassigned", "Aarav", "Isha", "Rahul", "Priya"];

