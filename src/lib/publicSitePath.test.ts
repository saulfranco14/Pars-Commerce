import { describe, expect, it } from "vitest";

import { publicSitePath } from "@/lib/publicSitePath";

describe("publicSitePath", () => {
  it("uses site_slug, which can differ from the dashboard slug", () => {
    expect(publicSitePath({ slug: "tienda-claudia-dev", site_slug: "tienda-claudia-dev-3375" })).toBe("/sitio/tienda-claudia-dev-3375");
  });

  it("falls back to slug when no public address was assigned", () => {
    expect(publicSitePath({ slug: "tienda-claudia", site_slug: null })).toBe("/sitio/tienda-claudia");
  });
});
