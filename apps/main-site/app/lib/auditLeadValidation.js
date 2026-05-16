/**
 * Shared validation for AI audit lead capture (client + API route).
 * @param {Record<string, unknown>} raw
 * @returns {{ ok: boolean; errors: Record<string, string>; data?: { business_name: string; website: string; instagram: string; problem: string; phone: string } }}
 */
export function validateAuditLeadPayload(raw) {
  /** @type {Record<string, string>} */
  const errors = {};

  const business_name = String(raw?.business_name ?? "").trim();
  if (!business_name) {
    errors.business_name = "Business name is required.";
  } else if (business_name.length > 200) {
    errors.business_name = "Please keep this under 200 characters.";
  }

  const websiteRaw = String(raw?.website ?? "").trim();
  let website = "";
  if (!websiteRaw) {
    errors.website = "Website URL is required.";
  } else {
    try {
      const u = new URL(websiteRaw.includes("://") ? websiteRaw : `https://${websiteRaw}`);
      if (!["http:", "https:"].includes(u.protocol)) {
        errors.website = "Enter a valid http(s) URL.";
      } else {
        website = u.href;
      }
    } catch {
      errors.website = "Enter a valid URL (e.g. yourbrand.com or https://…).";
    }
  }

  let instagram = String(raw?.instagram ?? "").trim();
  if (instagram) {
    instagram = instagram.replace(/^@+/, "");
    if (instagram.length > 100) {
      errors.instagram = "Please keep this under 100 characters.";
    }
  }

  const problem = String(raw?.problem ?? "").trim();
  if (problem.length > 4000) {
    errors.problem = "Please keep this under 4,000 characters.";
  }

  const phoneRaw = String(raw?.phone ?? "").trim();
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  if (!phoneRaw) {
    errors.phone = "Phone number is required.";
  } else if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.phone = "Enter a valid phone number (10–15 digits).";
  }

  const phone = phoneRaw;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: {},
    data: {
      business_name,
      website,
      instagram,
      problem,
      phone,
    },
  };
}
