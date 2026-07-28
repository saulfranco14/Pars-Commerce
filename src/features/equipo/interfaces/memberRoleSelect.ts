import type { TenantRoleOption } from "@/services/tenantRolesService";

export interface MemberRoleSelectProps {
  /** Roles del negocio, tal como los devuelve `/api/tenant-roles`. */
  roles: TenantRoleOption[];
  /** Rol asignado hoy a la persona. */
  value: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  /** Para lectores de pantalla: "Rol de Ana". */
  ariaLabel: string;
  className?: string;
}
