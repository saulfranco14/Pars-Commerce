import { describe, expect, it } from "vitest";

import { searchTerms } from "@/features/operaciones/services/operationsOverviewService";

describe("searchTerms", () => {
  it("needs at least two characters", () => {
    expect(searchTerms(" a ")).toBeNull();
    expect(searchTerms("E1")).toEqual({ text: "E1", table: "E1" });
  });

  it("a table can be typed with or without the word mesa", () => {
    expect(searchTerms("Mesa 4")).toEqual({ text: "Mesa 4", table: "4" });
    expect(searchTerms("mesa")).toEqual({ text: "mesa", table: "mesa" });
  });

  it("drops what would break the filter: commas, parentheses, wildcards, the leading #", () => {
    expect(searchTerms("#E1F9")).toEqual({ text: "E1F9", table: "E1F9" });
    expect(searchTerms("a,b)or(id.eq.1*%")).toEqual({ text: "a b or id.eq.1", table: "a b or id.eq.1" });
  });
});
