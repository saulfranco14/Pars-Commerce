import { PERMISSION_ALIASES } from "@/constants/permissionCatalog";

/**
 * The one rule both `requirePermission` (server) and `usePermission` (client)
 * apply: the owner holds everything; anyone else needs the permission itself
 * or a legacy alias of it.
 */
export function roleHasPermission(
  roleName: string | null | undefined,
  permissions: readonly string[] | null | undefined,
  permission: string,
): boolean {
  if (roleName === "owner") return true;
  const held = permissions ?? [];
  if (held.includes(permission)) return true;
  return (PERMISSION_ALIASES[permission] ?? []).some((alias) => held.includes(alias));
}

/** `true` when the role holds at least one of `anyOf`; an empty list means open to any member. */
export function roleHasAnyPermission(
  roleName: string | null | undefined,
  permissions: readonly string[] | null | undefined,
  anyOf: readonly string[],
): boolean {
  if (anyOf.length === 0) return true;
  return anyOf.some((permission) => roleHasPermission(roleName, permissions, permission));
}
