import {
  KNOWN_PERMISSIONS,
  PERMISSION_CATALOG,
  withRequiredPermissions,
} from "@/constants/permissionCatalog";
import { roleHasPermission } from "@/lib/auth/permissions";

const GRANTABLE = new Set(PERMISSION_CATALOG.filter((p) => !p.legacy).map((p) => p.key));

/**
 * Cleans what the editor sends: unknown keys are an error, legacy keys are
 * dropped (their replacements are what gets granted) and dependencies are added.
 */
export function normalizeRolePermissions(
  requested: unknown,
): { ok: true; permissions: string[] } | { ok: false; unknown: string[] } {
  if (!Array.isArray(requested) || requested.some((p) => typeof p !== "string")) {
    return { ok: false, unknown: ["(lista inválida)"] };
  }
  const unknown = (requested as string[]).filter((p) => !KNOWN_PERMISSIONS.has(p));
  if (unknown.length > 0) return { ok: false, unknown };
  const grantable = (requested as string[]).filter((p) => GRANTABLE.has(p));
  return { ok: true, permissions: withRequiredPermissions(grantable).sort() };
}

/**
 * Permissions someone may hand out: the owner, anything; anyone else, only
 * what their own role already holds, so team.write can't be a way up.
 */
export function permissionsBeyondActor(
  actor: { roleName: string; permissions: readonly string[] },
  granted: readonly string[],
): string[] {
  return granted.filter((p) => !roleHasPermission(actor.roleName, actor.permissions, p));
}

const NAME_MIN = 2;
const NAME_MAX = 40;

export function roleNameError(name: string): string | null {
  const clean = name.trim();
  if (clean.length < NAME_MIN) return "Ponle un nombre al rol.";
  if (clean.length > NAME_MAX) return `Usa máximo ${NAME_MAX} caracteres.`;
  return null;
}
