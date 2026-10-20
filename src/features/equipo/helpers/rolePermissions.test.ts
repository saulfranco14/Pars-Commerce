import { describe, it, expect } from "vitest";

import { normalizeRolePermissions, permissionsBeyondActor, roleNameError } from "@/features/equipo/helpers/rolePermissions";

describe("normalizeRolePermissions", () => {
  it("agrega lo que cada permiso necesita", () => {
    expect(normalizeRolePermissions(["orders.assign"])).toEqual({
      ok: true,
      permissions: ["orders.assign", "orders.read", "orders.view_all"],
    });
  });

  it("rechaza permisos que no existen", () => {
    expect(normalizeRolePermissions(["orders.read", "root.everything"])).toEqual({ ok: false, unknown: ["root.everything"] });
    expect(normalizeRolePermissions("orders.read").ok).toBe(false);
  });

  it("no otorga claves heredadas", () => {
    expect(normalizeRolePermissions(["qr.fulfill"])).toEqual({ ok: true, permissions: [] });
  });
});

describe("permissionsBeyondActor", () => {
  it("el propietario puede dar cualquier permiso", () => {
    expect(permissionsBeyondActor({ roleName: "owner", permissions: [] }, ["money.read", "settings.write"])).toEqual([]);
  });

  it("alguien más solo puede dar lo que su rol tiene", () => {
    const actor = { roleName: "gerente", permissions: ["team.read", "team.write", "orders.read"] };
    expect(permissionsBeyondActor(actor, ["orders.read", "money.read"])).toEqual(["money.read"]);
  });
});

describe("roleNameError", () => {
  it("pide un nombre corto pero real", () => {
    expect(roleNameError(" ")).toMatch(/nombre/);
    expect(roleNameError("Turno noche")).toBeNull();
    expect(roleNameError("x".repeat(41))).toMatch(/40/);
  });
});
