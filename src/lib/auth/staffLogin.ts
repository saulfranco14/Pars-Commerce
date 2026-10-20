/**
 * Staff without an email log in with a short username. Supabase needs an
 * email to sign in with a password, so the username maps to an address on a
 * domain nobody receives mail on; nothing is ever sent there.
 */
export const STAFF_LOGIN_DOMAIN = "equipo.tlaco.app";

const USERNAME_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

/** What the person typed in "Email o usuario" → the address Supabase knows. */
export function loginIdentifierToEmail(identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  return clean.includes("@") ? clean : `${clean}@${STAFF_LOGIN_DOMAIN}`;
}

export function isValidLoginIdentifier(identifier: string): boolean {
  const clean = identifier.trim().toLowerCase();
  if (clean.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
  return USERNAME_PATTERN.test(clean);
}

export function isStaffLoginEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(`@${STAFF_LOGIN_DOMAIN}`));
}

/** The username to show for an account, or null when it logs in with a real email. */
export function staffUsernameOf(email: string | null | undefined): string | null {
  return email && isStaffLoginEmail(email) ? email.slice(0, email.lastIndexOf("@")) : null;
}

/** "José Luis Pérez" + "4821" → "joseluis.4821". */
export function buildStaffUsername(displayName: string, suffix: string): string {
  const first = displayName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 2)
    .join("")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);
  return `${first || "equipo"}.${suffix}`;
}
