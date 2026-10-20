import { describe, it, expect } from "vitest";

import { previewRole, withoutPermission } from "@/features/equipo/helpers/rolePreview";
import { SYSTEM_ROLE_PERMISSIONS } from "@/constants/systemRoles";

describe("previewRole", () => {
  it("preparación solo ve su estación y entra ahí", () => {
    const preview = previewRole("preparer", SYSTEM_ROLE_PERMISSIONS.preparer);
    expect(preview.menu).toEqual(["Preparación"]);
    expect(preview.landing).toBe("Preparación");
  });

  it("el mesero entra a sus pedidos", () => {
    expect(previewRole("waiter", SYSTEM_ROLE_PERMISSIONS.waiter).landing).toBe("Mis pedidos");
  });

  it("el propietario ve todo y entra a Inicio", () => {
    const preview = previewRole("owner", []);
    expect(preview.landing).toBe("Inicio");
    expect(preview.menu).toContain("Mi dinero");
  });
});

describe("withoutPermission", () => {
  it("quitar ver todos los pedidos quita repartir el trabajo", () => {
    expect(withoutPermission(["orders.read", "orders.view_all", "orders.assign"], "orders.view_all")).toEqual(["orders.read"]);
  });

  it("quitar consultar pedidos quita todo lo que depende de eso", () => {
    expect(withoutPermission(["orders.read", "orders.prepare", "payments.write"], "orders.read")).toEqual(["payments.write"]);
  });
});
