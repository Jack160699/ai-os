const SESSION_SALT = "v2-owner-session";

export const OWNER_SESSION_COOKIE = "sx_v2_owner_session";

function getOwnerEmail() {
  return String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

function getOwnerPassword() {
  return String(process.env.ADMIN_PASSWORD || "");
}

export function hasOwnerCredentials() {
  return Boolean(getOwnerEmail() && getOwnerPassword());
}

export function isOwnerCredentialsMatch(email, password) {
  const ownerEmail = getOwnerEmail();
  const ownerPassword = getOwnerPassword();
  if (!ownerEmail || !ownerPassword) return false;
  return String(email || "").trim().toLowerCase() === ownerEmail && String(password || "") === ownerPassword;
}

async function sha256Hex(input) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return "";
  const bytes = new TextEncoder().encode(input);
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getOwnerSessionToken() {
  const ownerEmail = getOwnerEmail();
  const ownerPassword = getOwnerPassword();
  if (!ownerEmail || !ownerPassword) return "";
  return sha256Hex(`${SESSION_SALT}:${ownerEmail}:${ownerPassword}`);
}

export async function isValidOwnerSessionToken(cookieValue) {
  const expectedToken = await getOwnerSessionToken();
  if (!expectedToken || !cookieValue) return false;
  return String(cookieValue) === expectedToken;
}

export async function setOwnerSessionCookie(cookieStore) {
  const token = await getOwnerSessionToken();
  if (!token) return false;
  cookieStore.set(OWNER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return true;
}

export function clearOwnerSessionCookie(cookieStore) {
  cookieStore.set(OWNER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}
