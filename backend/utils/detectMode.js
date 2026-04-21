export function detectMode(message) {
  const msg = String(message || "").toLowerCase();

  if (msg.includes("human") || msg.includes("baat")) {
    return "HUMAN_MODE";
  }

  if (
    msg.includes("aap batao") ||
    msg.includes("you decide") ||
    msg.includes("idea nahi")
  ) {
    return "SUGGESTION_MODE";
  }

  if (
    msg.includes("price") ||
    msg.includes("cost") ||
    msg.includes("budget") ||
    msg.includes("kitna")
  ) {
    return "SALES_MODE";
  }

  return "QUALIFY_MODE";
}
