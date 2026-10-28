import { describe, expect, it } from "vitest";

import { leadFiltersQuery, parseLeadFilters } from "@/features/growth/helpers/leadFiltersQuery";

describe("lead filters in the URL", () => {
  it("round-trips the filters and drops defaults", () => {
    const filters = { stage: "en_lote" as const, municipio: "Nezahualcóyotl", contact: "whatsapp" as const, q: "comex", page: 3 };
    const query = leadFiltersQuery(filters);
    expect(parseLeadFilters(new URLSearchParams(query))).toEqual({ ...filters, vista: "seguimiento", giro: undefined, channel: undefined });
    expect(leadFiltersQuery({ vista: "contactar", stage: "hoy" })).toBe("vista=contactar&stage=hoy");
    expect(leadFiltersQuery({ stage: "activos", page: 1 })).toBe("");
    expect(leadFiltersQuery({ stage: "todos" })).toBe("stage=todos");
  });

  it("ignores values it doesn't know", () => {
    const parsed = parseLeadFilters(new URLSearchParams("stage=hackeado&contact=x&page=-4"));
    expect(parsed).toMatchObject({ stage: "activos", contact: undefined, page: 1 });
  });
});
