// Composed from the role's real permissions, not its name, so custom roles get
// a description and it can't drift from what authorization actually does.

import { PERMISSION_CATALOG } from "@/constants/permissionCatalog";
import { roleHasPermission } from "@/lib/auth/permissions";

export const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  member: "Colaborador",
  cashier: "Responsable de pedidos",
  waiter: "Mesero",
  preparer: "Preparación",
  courier: "Entregas",
};

export function roleLabel(name: string): string {
  return ROLE_LABELS[name] ?? name;
}

// `view_all` already covers `view_assigned`; naming both reads as a
// contradiction.
const SUPERSEDED: Record<string, string> = {
  "orders.view_all": "orders.view_assigned",
};

function joinPhrases(phrases: string[]): string {
  if (phrases.length <= 1) return phrases[0] ?? "";
  return `${phrases.slice(0, -1).join(", ")} y ${phrases[phrases.length - 1]}`;
}

// `owner` is described apart: listing ~30 permissions informs nobody.
export function describeRole(
  roleName: string,
  permissions: readonly string[],
): string {
  if (roleName === "owner") {
    return "Acceso total al negocio, sin restricciones.";
  }

  const hidden = new Set(
    permissions.map((p) => SUPERSEDED[p]).filter(Boolean),
  );

  // Phrase order follows the catalog: daily work first, admin last. Aliases
  // count, so a legacy `qr.fulfill` role still reads "avanzar la preparación".
  const phrases = PERMISSION_CATALOG.filter(
    (p) =>
      p.phrase &&
      !p.legacy &&
      !hidden.has(p.key) &&
      roleHasPermission(null, permissions, p.key),
  ).map((p) => p.phrase as string);

  if (phrases.length === 0) {
    return "Solo podrá consultar. Este rol no tiene permisos de edición.";
  }

  return `Podrá ${joinPhrases(phrases)}.`;
}
