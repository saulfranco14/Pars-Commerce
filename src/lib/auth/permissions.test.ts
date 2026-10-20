import { describe, it, expect } from "vitest";

import { roleHasAnyPermission, roleHasPermission } from "@/lib/auth/permissions";

describe("roleHasPermission", () => {
  it("le da todo al owner aunque su lista esté vacía", () => {
    expect(roleHasPermission("owner", [], "money.read")).toBe(true);
  });

  it("acepta el permiso exacto", () => {
    expect(roleHasPermission("cashier", ["payments.write"], "payments.write")).toBe(true);
  });

  it("niega lo que el rol no tiene", () => {
    expect(roleHasPermission("waiter", ["orders.read"], "money.read")).toBe(false);
  });

  it("un rol con qr.fulfill (antes de la migración) puede preparar y entregar", () => {
    expect(roleHasPermission("waiter", ["qr.fulfill"], "orders.prepare")).toBe(true);
    expect(roleHasPermission("waiter", ["qr.fulfill"], "orders.deliver")).toBe(true);
  });

  it("el alias no funciona al revés: preparar no otorga entregar", () => {
    expect(roleHasPermission("preparer", ["orders.prepare"], "orders.deliver")).toBe(false);
  });

  it("decide por permisos, no por nombre: un rol propio llamado 'cashier' no hereda nada", () => {
    expect(roleHasPermission("cashier", [], "orders.close")).toBe(false);
  });
});

describe("roleHasAnyPermission", () => {
  it("una lista vacía significa abierto a cualquier miembro", () => {
    expect(roleHasAnyPermission("courier", [], [])).toBe(true);
  });

  it("basta con tener uno de la lista", () => {
    expect(roleHasAnyPermission("waiter", ["order.take"], ["products.read", "order.take"])).toBe(true);
  });
});
