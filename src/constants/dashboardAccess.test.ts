import { describe, it, expect } from "vitest";

import {
  DASHBOARD_SECTION_PERMISSIONS,
  dashboardSectionOf,
  landingSection,
  sectionPermissions,
} from "@/constants/dashboardAccess";
import { roleHasAnyPermission } from "@/lib/auth/permissions";

import { SYSTEM_ROLE_PERMISSIONS as SYSTEM_ROLES } from "@/constants/systemRoles";

function visibleSections(role: string): string[] {
  return Object.keys(DASHBOARD_SECTION_PERMISSIONS)
    .filter((s) => roleHasAnyPermission(role, SYSTEM_ROLES[role] ?? [], sectionPermissions(s)))
    .sort();
}

describe("dashboardSectionOf", () => {
  it("toma el primer segmento después del negocio", () => {
    expect(dashboardSectionOf("/dashboard/mi-negocio/ordenes/123")).toBe("ordenes");
    expect(dashboardSectionOf("/dashboard/mi-negocio/equipo/roles")).toBe("equipo");
    expect(dashboardSectionOf("/dashboard/mi-negocio/configuracion/cuentas-bancarias")).toBe("configuracion");
  });

  it("cada estación de operación es su propia sección", () => {
    expect(dashboardSectionOf("/dashboard/mi-negocio/operacion/preparacion")).toBe("operacion/preparacion");
    expect(dashboardSectionOf("/dashboard/mi-negocio/operacion")).toBe("operacion");
  });

  it("el inicio del negocio es la sección \"inicio\"; las rutas de cuenta no son secciones", () => {
    expect(dashboardSectionOf("/dashboard/mi-negocio")).toBe("inicio");
    expect(dashboardSectionOf("/dashboard")).toBe("inicio");
    expect(dashboardSectionOf("/dashboard/plataforma")).toBeNull();
    expect(dashboardSectionOf("/dashboard/plataforma?view=users")).toBeNull();
    expect(dashboardSectionOf("/dashboard/perfil")).toBeNull();
  });
});

describe("qué ve cada rol de sistema en el menú", () => {
  it("el owner ve todo", () => {
    const all = Object.keys(DASHBOARD_SECTION_PERMISSIONS);
    expect(all.every((s) => roleHasAnyPermission("owner", [], sectionPermissions(s)))).toBe(true);
  });

  it("el mesero solo ve su operación: ni catálogo, ni dinero, ni datos de crédito", () => {
    expect(visibleSections("waiter")).toEqual(
      [
        "agenda",
        "cotizaciones",
        "mesas",
        "operacion",
        "operacion/entregas",
        "operacion/mis-pedidos",
        "operacion/preparacion",
        "ordenes",
        "pedidos",
      ].sort(),
    );
  });

  it("el encargado de pedidos ve pedidos, mesas y cobranza, sin administración", () => {
    const sections = visibleSections("cashier");
    expect(sections).toEqual(expect.arrayContaining(["ordenes", "mesas", "clientes", "prestamos"]));
    expect(sections).not.toEqual(expect.arrayContaining(["equipo"]));
    expect(sections).not.toContain("liquidaciones");
    expect(sections).not.toContain("configuracion");
  });

  it("preparación y entregas solo ven su estación", () => {
    expect(visibleSections("preparer")).toEqual(["operacion", "operacion/preparacion"]);
    expect(visibleSections("courier")).toEqual(["operacion", "operacion/entregas"]);
  });

  it("el encargado de pedidos reparte y cobra, pero no prepara ni entrega", () => {
    const sections = visibleSections("cashier");
    expect(sections).toEqual(expect.arrayContaining(["operacion/recepcion", "operacion/caja", "operacion/mis-pedidos"]));
    expect(sections).not.toContain("operacion/preparacion");
    expect(sections).not.toContain("operacion/entregas");
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

describe("a dónde aterriza cada rol al entrar", () => {
  const landingFor = (role: string) =>
    landingSection((s) => roleHasAnyPermission(role, SYSTEM_ROLES[role] ?? [], sectionPermissions(s)));

  it("quien ve el resumen del negocio entra a Inicio", () => {
    expect(landingFor("member")).toBe("inicio");
  });

  it("los roles que operan entran directo a su estación", () => {
    expect(landingFor("waiter")).toBe("operacion/mis-pedidos");
    expect(landingFor("cashier")).toBe("operacion/recepcion");
    expect(landingFor("preparer")).toBe("operacion/preparacion");
    expect(landingFor("courier")).toBe("operacion/entregas");
  });
});
