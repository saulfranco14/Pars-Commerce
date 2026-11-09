import type { StudioMembership } from "../interfaces/studio";

export function isStudioMembershipActive(
  membership: StudioMembership | null,
  now = new Date(),
): boolean {
  return Boolean(
    membership &&
      ["active", "cancelling"].includes(membership.status) &&
      membership.current_period_start &&
      new Date(membership.current_period_start) <= now &&
      membership.current_period_end &&
      new Date(membership.current_period_end) > now,
  );
}

export function studioHref(
  tenantSlug: string,
  source?: string,
  id?: string,
): string {
  const query = new URLSearchParams();
  if (source) query.set("source", source);
  if (id) query.set("id", id);
  return `/dashboard/${encodeURIComponent(tenantSlug)}/studio${source ? `/nuevo?${query}` : ""}`;
}

export function validStudioDestination(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
