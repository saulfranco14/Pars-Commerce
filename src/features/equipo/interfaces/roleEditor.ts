import type { RoleEditorController } from "@/features/equipo/hooks/useRoleEditor";
import type { TenantRoleOption } from "@/services/tenantRolesService";

export interface RoleEditorPartProps {
  editor: RoleEditorController;
}

export interface NewRoleSheetProps {
  isOpen: boolean;
  roles: TenantRoleOption[];
  onClose: () => void;
  onCreate: (name: string, basePermissions: string[]) => Promise<boolean>;
}
