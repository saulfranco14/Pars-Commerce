import { describe, it, expect } from "vitest";

import { generateStaffPassword, staffPasswordError } from "@/lib/auth/staffPassword";

describe("generateStaffPassword", () => {
  it("tiene 3 bloques de 4 caracteres sin caracteres confusos", () => {
    for (let i = 0; i < 200; i++) {
      const password = generateStaffPassword();
      expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}$/);
      expect(password).not.toMatch(/[0O1lI]/);
    }
  });

  it("no se repite", () => {
    const seen = new Set(Array.from({ length: 500 }, generateStaffPassword));
    expect(seen.size).toBe(500);
  });

  it("pasa su propia validación", () => {
    expect(staffPasswordError(generateStaffPassword())).toBeNull();
  });
});

describe("staffPasswordError", () => {
  it("pide una contraseña", () => {
    expect(staffPasswordError("")).toMatch(/Escribe/);
    expect(staffPasswordError(undefined)).toMatch(/Escribe/);
  });

  it("rechaza menos de 8 caracteres", () => {
    expect(staffPasswordError("abc123")).toMatch(/8/);
    expect(staffPasswordError("abcd1234")).toBeNull();
  });
});
