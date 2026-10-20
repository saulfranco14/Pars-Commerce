import { describe, it, expect } from "vitest";

import {
  DASHBOARD_SECTION_PERMISSIONS,
  dashboardSectionOf,
  sectionPermissions,
} from "@/constants/dashboardAccess";
import { roleHasAnyPermission } from "@/lib/auth/permissions";

// Same lists `handle_new_tenant()` seeds (20261019230000), owner aside.
const SYSTEM_ROLES: Record<string, string[]> = {
  member: ["sales.read", "sales.write", "sales.view_all", "sales.view_assigned", "sales.assign", "sales.update_assigned", "products.read", "products.write", "inventory.read", "inventory.write", "promotions.read", "promotions.write", "reports.read", "team.read", "orders.read", "orders.write", "orders.view_assigned", "order.take"],
  cashier: ["sales.read", "sales.write", "sales.view_all", "sales.view_assigned", "orders.read", "orders.write", "orders.view_all", "orders.view_assigned", "orders.assign", "orders.close", "payments.write", "qr.read", "order.take"],
  waiter: ["orders.read", "orders.write", "orders.view_assigned", "orders.prepare", "orders.deliver", "qr.read", "qr.fulfill", "order.take"],
  preparer: ["orders.read", "orders.view_assigned", "orders.prepare"],
  courier: ["orders.read", "orders.view_assigned", "orders.deliver"],
};

function visibleSections(role: string): string[] {
  return Object.keys(DASHBOARD_SECTION_PERMISSIONS)
    .filter((s) => roleHasAnyPermission(role, SYSTEM_ROLES[role] ?? [], sectionPermissions(s)))
    .sort();
}

describe("dashboardSectionOf", () => {
  it("toma el primer segmento después del negocio", () => {
    expect(dashboardSectionOf("/dashboard/mi-negocio/ordenes/123")).toBe("ordenes");
    expect(dashboardSectionOf("/dashboard/mi-negocio/configuracion/cuentas-bancarias")).toBe("configuracion");
  });

  it("el inicio del negocio y las rutas de plataforma no son secciones", () => {
    expect(dashboardSectionOf("/dashboard/mi-negocio")).toBeNull();
    expect(dashboardSectionOf("/dashboard/plataforma")).toBeNull();
  });
});

describe("qué ve cada rol de sistema en el menú", () => {
  it("el owner ve todo", () => {
    const all = Object.keys(DASHBOARD_SECTION_PERMISSIONS);
    expect(all.every((s) => roleHasAnyPermission("owner", [], sectionPermissions(s)))).toBe(true);
  });

  it("el mesero solo ve su operación: ni catálogo, ni dinero, ni datos de crédito", () => {
    expect(visibleSections("waiter")).toEqual(
      ["agenda", "cotizaciones", "mesas", "ordenes", "pedidos"].sort(),
    );
  });

  it("el encargado de pedidos ve pedidos, mesas y cobranza, sin administración", () => {
    const sections = visibleSections("cashier");
    expect(sections).toEqual(expect.arrayContaining(["ordenes", "mesas", "clientes", "prestamos"]));
    expect(sections).not.toEqual(expect.arrayContaining(["equipo"]));
    expect(sections).not.toContain("liquidaciones");
    expect(sections).not.toContain("configuracion");
  });

  it("preparación y entregas solo ven pedidos", () => {
    expect(visibleSections("preparer")).toEqual(["agenda", "ordenes"]);
    expect(visibleSections("courier")).toEqual(["agenda", "ordenes"]);
  });

  it("ningún rol de sistema que no sea owner ve dinero, equipo o configuración", () => {
    for (const role of Object.keys(SYSTEM_ROLES)) {
      const sections = visibleSections(role);
      expect(sections).not.toContain("liquidaciones");
      expect(sections).not.toContain("ventas");
      expect(sections).not.toContain("equipo");
      expect(sections).not.toContain("configuracion");
    }
  });
});
