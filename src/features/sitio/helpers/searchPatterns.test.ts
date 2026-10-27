import { describe, expect, it } from "vitest";

import { searchPatterns } from "@/features/sitio/helpers/searchPatterns";

describe("searchPatterns", () => {
  it("keeps the term as typed", () => {
    expect(searchPatterns("ce")).toEqual(["%ce%"]);
  });

  it("adds an accent-tolerant pattern once the term is specific enough", () => {
    expect(searchPatterns("azucar")).toEqual(["%azucar%", "%_z_c_r%"]);
    expect(searchPatterns("Azúcar")).toEqual(["%Azúcar%", "%_z_c_r%"]);
  });

  it("lets a plain n match ñ", () => {
    expect(searchPatterns("penafiel")).toEqual(["%penafiel%", "%p___f__l%"]);
  });
});
