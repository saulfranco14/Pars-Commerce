import { addMember } from "@/services/teamService";

import type { TeamFieldValues } from "@/features/equipo/validations/teamFieldSchema";
import type { StaffCredentials } from "@/types/team";

/** `credentials` is null when the person already had an account and was only added to the team. */
export interface AddMemberResult {
  credentials: StaffCredentials | null;
}

export async function addTeamMemberFromForm(
  tenantId: string,
  values: TeamFieldValues,
): Promise<AddMemberResult> {
  const data = (await addMember({
    tenant_id: tenantId,
    role_id: values.role_id,
    email: values.email?.trim() || undefined,
    display_name: values.display_name.trim(),
  })) as { tempPassword?: string | null; username?: string | null };

  return {
    credentials: data.tempPassword
      ? { tempPassword: data.tempPassword, username: data.username ?? null }
      : null,
  };
}
