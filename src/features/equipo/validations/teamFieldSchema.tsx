import { Controller } from "react-hook-form";
import { Mail, User } from "lucide-react";

import { StaffPasswordInput } from "@/features/equipo/components/StaffPasswordInput";

import { list as listTenantRoles } from "@/services/tenantRolesService";
import { roleLabel } from "@/features/equipo/constants/roleDescriptions";
import { staffPasswordError } from "@/lib/auth/staffPassword";

import type { CrossFieldRule, FieldSchema } from "@/lib/forms/fieldSchema";

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
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      icon: Mail,
      placeholder: "usuario@ejemplo.com",
      required: false,
      hint: "Sin email le creamos un usuario para entrar, como juan.4821.",
    },
    {
      name: "password",
      label: "Contraseña",
      type: "custom",
      render: ({ control }) => (
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <StaffPasswordInput
              id="team-member-password"
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              error={fieldState.isTouched || fieldState.isDirty ? fieldState.error?.message : null}
            />
          )}
        />
      ),
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
          .map((r) => ({ value: r.id, label: roleLabel(r.name) }));
      },
    },
  ];
}

export const TEAM_CROSS_FIELD_RULES: CrossFieldRule[] = [
  {
    name: "staff-password",
    path: "password",
    message: "Usa al menos 8 caracteres.",
    test: (values) => staffPasswordError(values.password as string | undefined) === null,
  },
];

export interface TeamFieldValues {
  display_name: string;
  email?: string;
  password: string;
  role_id: string;
}
