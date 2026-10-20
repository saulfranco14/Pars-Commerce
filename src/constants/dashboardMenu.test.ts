import { describe, it, expect } from "vitest";

import { menuPreferencesOf, resolveMenu } from "@/constants/dashboardMenu";
import { sectionPermissions } from "@/constants/dashboardAccess";
import { roleHasAnyPermission } from "@/lib/auth/permissions";
import { SYSTEM_ROLE_PERMISSIONS } from "@/constants/systemRoles";

const ownerCan = () => true;
const roleCan = (role: string) => (section: string | null) =>
  roleHasAnyPermission(role, SYSTEM_ROLE_PERMISSIONS[role] ?? [], sectionPermissions(section));

describe("menuPreferencesOf", () => {
  it("ignora entradas desconocidas y nunca oculta Configuración", () => {
    const prefs = menuPreferencesOf({ menu: { order: ["mesas", "inventado"], hidden: ["configuracion", "qr", 3] } });
    expect(prefs).toEqual({ order: ["mesas"], hidden: ["qr"] });
  });

  it("sin preferencias, todo en su orden de siempre", () => {
    expect(menuPreferencesOf(null)).toEqual({ order: [], hidden: [] });
  });
});

describe("resolveMenu", () => {
  it("respeta el orden y lo que el negocio oculta", () => {
    const prefs = menuPreferencesOf({ menu: { order: ["mesas", "productos"], hidden: ["suscripciones"] } });
    const gestion = resolveMenu(prefs, ownerCan).find((g) => g.key === "gestion")!;
    expect(gestion.items.slice(0, 2).map((i) => i.path)).toEqual(["mesas", "productos"]);
    expect(gestion.items.map((i) => i.path)).not.toContain("suscripciones");
  });

  it("lo que el negocio muestra no salta los permisos del rol", () => {
    const groups = resolveMenu(menuPreferencesOf(null), roleCan("preparer"));
    expect(groups.map((g) => g.key)).toEqual(["operacion"]);
    expect(groups[0].items.map((i) => i.path)).toEqual(["operacion/preparacion"]);
  });

  it("un grupo sin entradas visibles no aparece", () => {
    const prefs = menuPreferencesOf({ menu: { hidden: ["prestamos", "credito", "clientes"] } });
    expect(resolveMenu(prefs, ownerCan).map((g) => g.key)).not.toContain("cobranza");
  });
});
