import { Mail, User } from "lucide-react";

import { list as listTenantRoles } from "@/services/tenantRolesService";
import { ROLE_DESCRIPTIONS } from "@/features/equipo/constants/roleDescriptions";

import type { FieldSchema } from "@/lib/forms/fieldSchema";

interface BuildTeamFieldsOptions {
  tenantId: string;
}

/**
 * Declarative registration fields for "Agregar miembro". The role select
 * loads its options from the tenant's roles (excluding "owner" — there's
 * only ever one owner, assigned at tenant creation).
 */
export function buildTeamFields({ tenantId }: BuildTeamFieldsOptions): FieldSchema[] {
  return [
    {
      name: "display_name",
      label: "Nombre",
      type: "text",
      icon: User,
      placeholder: "Nombre de la persona",
      required: false,
    },
    {
      name: "email",
      label: "Email del usuario",
      type: "email",
      icon: Mail,
      placeholder: "usuario@ejemplo.com",
      required: true,
    },
    {
      name: "role_id",
      label: "Rol",
      type: "select",
      required: true,
      emptyOptionLabel: "Selecciona un rol",
      options: async () => {
        const roles = await listTenantRoles(tenantId);
        return roles
          .filter((r) => r.name !== "owner")
          .map((r) => ({ value: r.id, label: r.name }));
      },
      hintForOption: (option) =>
        option ? ROLE_DESCRIPTIONS[option.label] : undefined,
    },
  ];
}

export interface TeamFieldValues {
  display_name?: string;
  email: string;
  role_id: string;
}
