import { describe, it, expect } from "vitest";

import { generateTempPassword } from "@/lib/auth/tempPassword";

describe("generateTempPassword", () => {
  it("tiene 3 bloques de 4 caracteres sin caracteres confusos", () => {
    for (let i = 0; i < 200; i++) {
      const password = generateTempPassword();
      expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}$/);
      expect(password).not.toMatch(/[0O1lI]/);
    }
  });

  it("no se repite", () => {
    const seen = new Set(Array.from({ length: 500 }, generateTempPassword));
    expect(seen.size).toBe(500);
  });
});
