import { PERMISSION_CATALOG } from "@/constants/permissionCatalog";
import { landingSection, sectionPermissions } from "@/constants/dashboardAccess";
import { roleHasAnyPermission } from "@/lib/auth/permissions";
import { MENU_SECTIONS } from "@/features/equipo/constants/sectionLabels";

export interface RolePreview {
  /** Menu entries this role will see, in sidebar order. */
  menu: string[];
  /** Where it lands after logging in. */
  landing: string | null;
}

/** What a person with these permissions sees: the same map the real menu reads. */
export function previewRole(roleName: string, permissions: readonly string[]): RolePreview {
  const canOpen = (section: string | null) =>
    roleHasAnyPermission(roleName, permissions, sectionPermissions(section));
  const landingKey = landingSection(canOpen);
  return {
    menu: MENU_SECTIONS.filter((s) => canOpen(s.key)).map((s) => s.label),
    landing: MENU_SECTIONS.find((s) => s.key === landingKey)?.label ?? null,
  };
}

const REQUIRES = new Map(PERMISSION_CATALOG.map((p) => [p.key, p.requires ?? []]));

function dependsOn(key: string, target: string, seen = new Set<string>()): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return (REQUIRES.get(key) ?? []).some((dep) => dep === target || dependsOn(dep, target, seen));
}

/** Turning a permission off also turns off the ones that need it. */
export function withoutPermission(permissions: readonly string[], key: string): string[] {
  return permissions.filter((p) => p !== key && !dependsOn(p, key));
}
