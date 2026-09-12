import { addMember } from "@/services/teamService";

import type { TeamFieldValues } from "@/features/equipo/validations/teamFieldSchema";

export interface AddMemberResult {
  invitedByEmail: boolean;
  tempPassword: string | null;
}

/**
 * Maps the schema-driven form values into the /api/team payload. The result
 * tells the caller which of the two post-creation states to render (email
 * invite sent vs. a temp password to hand off manually) — that branching UI
 * lives in the form component, this only owns the API call/mapping.
 */
export async function addTeamMemberFromForm(
  tenantId: string,
  values: TeamFieldValues,
): Promise<AddMemberResult> {
  const data = (await addMember({
    tenant_id: tenantId,
    role_id: values.role_id,
    email: values.email.trim(),
    display_name: values.display_name?.trim() || undefined,
  })) as { invitedByEmail?: boolean; tempPassword?: string };

  return {
    invitedByEmail: Boolean(data.invitedByEmail),
    tempPassword: data.tempPassword ?? null,
  };
}
