import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

import {
  KNOWN_PERMISSIONS,
  PERMISSION_ALIASES,
  PERMISSION_CATALOG,
  withRequiredPermissions,
} from "@/constants/permissionCatalog";

const MIGRATION = "supabase/migrations/20261019230000_operations_roles_permissions.sql";

/** Every key inside a `'[...]'::jsonb` literal in the migration. */
function seededPermissions(): Set<string> {
  const sql = readFileSync(MIGRATION, "utf8");
  const keys = new Set<string>();
  for (const [, list] of sql.matchAll(/'(\[[^']*\])'::jsonb/g)) {
    for (const key of JSON.parse(list) as string[]) keys.add(key);
  }
  return keys;
}

describe("permissionCatalog", () => {
  it("toda llave sembrada en SQL existe en el catálogo (si no, nadie podría otorgarla)", () => {
    const missing = [...seededPermissions()].filter((k) => !KNOWN_PERMISSIONS.has(k));
    expect(missing).toEqual([]);
  });

  it("toda dependencia y todo alias apuntan a permisos que existen", () => {
    const referenced = [
      ...PERMISSION_CATALOG.flatMap((p) => p.requires ?? []),
      ...Object.keys(PERMISSION_ALIASES),
      ...Object.values(PERMISSION_ALIASES).flat(),
    ];
    expect(referenced.filter((k) => !KNOWN_PERMISSIONS.has(k))).toEqual([]);
  });

  it("no repite llaves", () => {
    expect(KNOWN_PERMISSIONS.size).toBe(PERMISSION_CATALOG.length);
  });

  it("repartir el trabajo arrastra ver todos los pedidos y consultarlos", () => {
    expect(withRequiredPermissions(["orders.assign"]).sort()).toEqual(
      ["orders.assign", "orders.read", "orders.view_all"].sort(),
    );
  });
});
