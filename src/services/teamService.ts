import type { TeamMember } from "@/types/team";
import { apiFetch } from "@/services/apiFetch";

export async function list(tenantId: string): Promise<TeamMember[]> {
  const data = await apiFetch(
    `/api/team?tenant_id=${encodeURIComponent(tenantId)}`
  );
  return Array.isArray(data) ? (data as TeamMember[]) : [];
}

export async function addMember(payload: {
  tenant_id: string;
  role_id: string;
  user_id?: string;
  email?: string;
  display_name?: string;
}): Promise<unknown> {
  const data = await apiFetch("/api/team", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function updateRole(
  membershipId: string,
  roleId: string
): Promise<void> {
  await apiFetch("/api/team", {
    method: "PATCH",
    body: JSON.stringify({ membership_id: membershipId, role_id: roleId }),
  });
}

export async function remove(membershipId: string): Promise<void> {
  await apiFetch(
    `/api/team?membership_id=${encodeURIComponent(membershipId)}`,
    { method: "DELETE" }
  );
}
