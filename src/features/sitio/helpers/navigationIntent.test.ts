import { describe, expect, it } from "vitest";

import { internalNavigationTarget } from "@/features/sitio/helpers/navigationIntent";

const HERE = "https://tlaco.app/sitio/tienda/productos?subcatalog_id=a";

describe("internalNavigationTarget", () => {
  it("returns the path and query of an in-app link", () => {
    expect(internalNavigationTarget("/sitio/tienda/productos?subcatalog_id=b", HERE, false)).toBe(
      "/sitio/tienda/productos?subcatalog_id=b",
    );
  });

  it("ignores the page already on screen and hash jumps on it", () => {
    expect(internalNavigationTarget("/sitio/tienda/productos?subcatalog_id=a", HERE, false)).toBeNull();
    expect(internalNavigationTarget("#faq", HERE, false)).toBeNull();
  });

  it("ignores other sites, WhatsApp and new tabs", () => {
    expect(internalNavigationTarget("https://wa.me/5215512345678", HERE, false)).toBeNull();
    expect(internalNavigationTarget("tel:5512345678", HERE, false)).toBeNull();
    expect(internalNavigationTarget("/sitio/tienda/inicio", HERE, true)).toBeNull();
  });
});
